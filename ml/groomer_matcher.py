"""
groomer_matcher.py — Cross-child groomer fingerprinting.

Detects when the SAME suspected groomer is targeting MULTIPLE children
by building a behavioral + network fingerprint and matching it across
conversations.

Fingerprint components:
  A) Network:   IP address, IP subnet, ASN
  B) Behavioral: vocabulary n-grams, phrase templates, emoji patterns,
                 time-of-day activity, platform-switch target apps,
                 label sequence (trust→isolation→desensitization etc.)

The matcher maintains a Redis-backed (or in-memory fallback) store of
known groomer fingerprints and raises a CROSS_CHILD_MATCH flag when
a new conversation exceeds similarity thresholds.

Usage:
  from ml.groomer_matcher import GroomerMatcher, ConversationFingerprint
  matcher = GroomerMatcher()
  fp = matcher.build_fingerprint(session)
  match = matcher.match(fp)
  if match.is_match:
      print(f"Cross-child groomer detected: {match.matched_groomer_id}")
"""

import re
import math
import json
import hashlib
import logging
from collections import Counter
from dataclasses import dataclass, field, asdict
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Session dataclass — caller populates this before calling the matcher
# ---------------------------------------------------------------------------
@dataclass
class ConversationSession:
    """
    A single conversation session between a suspected adult and a child.

    Fields:
        session_id:     unique ID for this conversation/session
        suspect_ip:     IP address of the adult-side sender
        messages:       list of dicts {"role": "suspect"|"child", "text": str}
        platform:       platform name (e.g. "instagram", "discord")
        timestamps:     list of Unix timestamps aligned with messages
        child_user_id:  anonymised child identifier
    """
    session_id: str
    suspect_ip: str
    messages: list
    platform: str
    timestamps: list = field(default_factory=list)
    child_user_id: str = ""


# ---------------------------------------------------------------------------
# Fingerprint
# ---------------------------------------------------------------------------
@dataclass
class ConversationFingerprint:
    session_id: str
    child_user_id: str
    platform: str

    # Network
    ip_address: str = ""
    ip_subnet: str = ""       # /24 CIDR (anonymised block)

    # Behavioral
    top_bigrams: list = field(default_factory=list)         # top 20 word bigrams
    top_phrases: list = field(default_factory=list)         # top 10 3-6 gram phrases
    emoji_signature: list = field(default_factory=list)     # top 5 emojis used
    platform_switch_targets: list = field(default_factory=list)  # apps mentioned
    label_sequence: list = field(default_factory=list)      # ML label order
    active_hours: list = field(default_factory=list)        # hour-of-day buckets [0-23]
    vocab_hash: str = ""   # SHA-256 of sorted vocabulary (fast equality check)

    def to_dict(self):
        return asdict(self)


# ---------------------------------------------------------------------------
# Match result
# ---------------------------------------------------------------------------
@dataclass
class MatchResult:
    is_match: bool = False
    matched_groomer_id: Optional[str] = None
    similarity_score: float = 0.0
    matched_session_ids: list = field(default_factory=list)
    matched_child_ids: list = field(default_factory=list)
    match_reasons: list = field(default_factory=list)

    def to_dict(self):
        return asdict(self)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
_EMOJI_RE = re.compile(
    "["
    "\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F700-\U0001F77F"
    "\U0001F780-\U0001F7FF"
    "\U0001F800-\U0001F8FF"
    "\U0001F900-\U0001F9FF"
    "\U0001FA00-\U0001FA6F"
    "\U0001FA70-\U0001FAFF"
    "\U00002702-\U000027B0"
    "]+",
    flags=re.UNICODE,
)

_PLATFORM_NAMES = [
    "whatsapp", "telegram", "signal", "snapchat", "discord",
    "kik", "wechat", "instagram", "tiktok", "line", "viber",
    "skype", "wickr", "threema",
]

_STOP_WORDS = {
    "i", "me", "my", "you", "your", "the", "a", "an", "is", "it",
    "to", "do", "so", "on", "in", "at", "of", "and", "or", "but",
    "that", "this", "was", "be", "are", "we", "he", "she", "they",
    "have", "has", "for", "with", "like", "just", "can", "get", "will",
}


def _extract_suspect_text(session: ConversationSession) -> str:
    """Concatenate only the SUSPECT's messages."""
    return " ".join(
        m["text"] for m in session.messages if m.get("role") == "suspect"
    ).lower()


def _ngrams(tokens: list, n: int) -> list:
    return [" ".join(tokens[i:i+n]) for i in range(len(tokens) - n + 1)]


def _top_k(counter: Counter, k: int) -> list:
    return [item for item, _ in counter.most_common(k)]


def _ip_subnet(ip: str) -> str:
    """Return /24 subnet string, e.g. '192.168.1' from '192.168.1.42'."""
    parts = ip.split(".")
    if len(parts) == 4:
        return ".".join(parts[:3])
    return ip  # IPv6 or unusual: return as-is


def _jaccard(set_a: set, set_b: set) -> float:
    if not set_a and not set_b:
        return 1.0
    union = set_a | set_b
    if not union:
        return 0.0
    return len(set_a & set_b) / len(union)


def _cosine_counter(c1: Counter, c2: Counter) -> float:
    """Cosine similarity between two Counter objects."""
    if not c1 or not c2:
        return 0.0
    common = set(c1) & set(c2)
    dot = sum(c1[k] * c2[k] for k in common)
    mag1 = math.sqrt(sum(v*v for v in c1.values()))
    mag2 = math.sqrt(sum(v*v for v in c2.values()))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot / (mag1 * mag2)


# ---------------------------------------------------------------------------
# Groomer Matcher
# ---------------------------------------------------------------------------
class GroomerMatcher:
    """
    Builds and matches behavioral fingerprints across conversations.

    Storage backends:
      - In-memory dict (default, for dev/testing)
      - Redis (production) — set use_redis=True and provide redis_url

    Similarity is a weighted combination of:
      - IP match (hard signal): weight 0.40
      - Bigram cosine similarity: weight 0.25
      - Phrase Jaccard similarity: weight 0.15
      - Emoji Jaccard similarity: weight 0.05
      - Label sequence similarity: weight 0.10
      - Platform switch targets Jaccard: weight 0.05
    """

    WEIGHTS = {
        "ip_exact": 0.40,
        "bigram_cosine": 0.25,
        "phrase_jaccard": 0.15,
        "emoji_jaccard": 0.05,
        "label_seq": 0.10,
        "platform_jaccard": 0.05,
    }

    def __init__(
        self,
        match_threshold: float = 0.55,
        use_redis: bool = False,
        redis_url: str = "redis://localhost:6379/0",
    ):
        self.match_threshold = match_threshold
        self._store: dict[str, list[ConversationFingerprint]] = {}  # groomer_id → [fps]

        if use_redis:
            try:
                import redis
                self._redis = redis.from_url(redis_url, decode_responses=True)
                self._redis.ping()
                self._use_redis = True
                logger.info("GroomerMatcher: connected to Redis.")
            except Exception as e:
                logger.warning(f"Redis unavailable ({e}), falling back to in-memory store.")
                self._use_redis = False
        else:
            self._use_redis = False

    # ------------------------------------------------------------------
    def build_fingerprint(
        self,
        session: ConversationSession,
        label_sequence: Optional[list] = None,
    ) -> ConversationFingerprint:
        """
        Build a behavioral + network fingerprint from a conversation session.

        Args:
            session:        ConversationSession object
            label_sequence: optional list of ML labels in the order they
                            appeared (from grooming_matcher pipeline)
        """
        suspect_text = _extract_suspect_text(session)

        # Tokenise (simple whitespace + punctuation strip)
        tokens = re.findall(r"[a-z']+", suspect_text)
        filtered = [t for t in tokens if t not in _STOP_WORDS and len(t) > 1]

        # Bigrams
        bigram_counter = Counter(_ngrams(filtered, 2))
        top_bigrams = _top_k(bigram_counter, 20)

        # Phrases (3–5 grams)
        phrase_counter = Counter()
        for n in (3, 4, 5):
            phrase_counter.update(_ngrams(filtered, n))
        top_phrases = _top_k(phrase_counter, 10)

        # Emojis
        all_emojis = _EMOJI_RE.findall(suspect_text)
        emoji_counter = Counter(all_emojis)
        top_emojis = _top_k(emoji_counter, 5)

        # Platform switch targets
        platform_targets = [
            p for p in _PLATFORM_NAMES if p in suspect_text
        ]

        # Active hours
        active_hours: list[int] = []
        if session.timestamps:
            import datetime
            for ts in session.timestamps:
                try:
                    active_hours.append(
                        datetime.datetime.utcfromtimestamp(ts).hour
                    )
                except Exception:
                    pass
        active_hours = list(set(active_hours))

        # Vocab hash (fast equality)
        vocab = sorted(set(filtered))
        vocab_hash = hashlib.sha256(" ".join(vocab).encode()).hexdigest()[:16]

        return ConversationFingerprint(
            session_id=session.session_id,
            child_user_id=session.child_user_id,
            platform=session.platform,
            ip_address=session.suspect_ip,
            ip_subnet=_ip_subnet(session.suspect_ip),
            top_bigrams=top_bigrams,
            top_phrases=top_phrases,
            emoji_signature=top_emojis,
            platform_switch_targets=platform_targets,
            label_sequence=label_sequence or [],
            active_hours=active_hours,
            vocab_hash=vocab_hash,
        )

    # ------------------------------------------------------------------
    def _compute_similarity(
        self,
        fp_new: ConversationFingerprint,
        fp_known: ConversationFingerprint,
    ) -> tuple[float, list[str]]:
        """
        Compute weighted similarity score between two fingerprints.
        Returns (score, reasons).
        """
        reasons = []
        score = 0.0

        # 1. IP exact match (strongest signal)
        if fp_new.ip_address and fp_new.ip_address == fp_known.ip_address:
            score += self.WEIGHTS["ip_exact"]
            reasons.append(f"Exact IP match: {fp_new.ip_address}")
        elif fp_new.ip_subnet and fp_new.ip_subnet == fp_known.ip_subnet:
            score += self.WEIGHTS["ip_exact"] * 0.5
            reasons.append(f"Same /24 subnet: {fp_new.ip_subnet}")

        # 2. Bigram cosine
        c1 = Counter(fp_new.top_bigrams)
        c2 = Counter(fp_known.top_bigrams)
        bg_sim = _cosine_counter(c1, c2)
        score += self.WEIGHTS["bigram_cosine"] * bg_sim
        if bg_sim > 0.5:
            reasons.append(f"High bigram similarity: {bg_sim:.2f}")

        # 3. Phrase Jaccard
        ph_sim = _jaccard(set(fp_new.top_phrases), set(fp_known.top_phrases))
        score += self.WEIGHTS["phrase_jaccard"] * ph_sim
        if ph_sim > 0.4:
            reasons.append(f"Shared phrase templates: {ph_sim:.2f}")

        # 4. Emoji Jaccard
        em_sim = _jaccard(set(fp_new.emoji_signature), set(fp_known.emoji_signature))
        score += self.WEIGHTS["emoji_jaccard"] * em_sim

        # 5. Label sequence similarity
        if fp_new.label_sequence and fp_known.label_sequence:
            ls_sim = _jaccard(set(fp_new.label_sequence), set(fp_known.label_sequence))
            score += self.WEIGHTS["label_seq"] * ls_sim
            if ls_sim > 0.6:
                reasons.append(f"Similar grooming pattern sequence: {ls_sim:.2f}")

        # 6. Platform switch targets
        pl_sim = _jaccard(
            set(fp_new.platform_switch_targets),
            set(fp_known.platform_switch_targets),
        )
        score += self.WEIGHTS["platform_jaccard"] * pl_sim

        return round(score, 4), reasons

    # ------------------------------------------------------------------
    def match(self, fp_new: ConversationFingerprint) -> MatchResult:
        """
        Check whether fp_new matches a known groomer fingerprint in the store.

        Returns MatchResult with match details.
        """
        best_score = 0.0
        best_groomer_id = None
        best_reasons: list[str] = []
        matched_sessions: list[str] = []
        matched_children: list[str] = []

        all_fingerprints = self._load_all_fingerprints()

        for groomer_id, known_fps in all_fingerprints.items():
            for known_fp in known_fps:
                # Don't match against the same session
                if known_fp.session_id == fp_new.session_id:
                    continue
                sim, reasons = self._compute_similarity(fp_new, known_fp)
                if sim > best_score:
                    best_score = sim
                    best_groomer_id = groomer_id
                    best_reasons = reasons
                    matched_sessions = [known_fp.session_id]
                    matched_children = [known_fp.child_user_id]

        is_match = best_score >= self.match_threshold
        if is_match:
            logger.warning(
                f"Cross-child groomer match! groomer_id={best_groomer_id} "
                f"score={best_score:.3f} session={fp_new.session_id}"
            )

        return MatchResult(
            is_match=is_match,
            matched_groomer_id=best_groomer_id,
            similarity_score=best_score,
            matched_session_ids=matched_sessions,
            matched_child_ids=matched_children,
            match_reasons=best_reasons,
        )

    # ------------------------------------------------------------------
    def register(
        self,
        fp: ConversationFingerprint,
        groomer_id: Optional[str] = None,
    ) -> str:
        """
        Add a fingerprint to the store.
        If groomer_id is None, a new groomer profile is created.
        Returns the groomer_id used.
        """
        if groomer_id is None:
            groomer_id = hashlib.sha256(
                fp.session_id.encode()
            ).hexdigest()[:12]

        if self._use_redis:
            self._redis_register(groomer_id, fp)
        else:
            self._store.setdefault(groomer_id, []).append(fp)

        logger.info(f"Fingerprint registered: groomer_id={groomer_id}")
        return groomer_id

    # ------------------------------------------------------------------
    # Redis helpers
    # ------------------------------------------------------------------
    def _redis_register(self, groomer_id: str, fp: ConversationFingerprint):
        key = f"groomer:{groomer_id}:fps"
        existing_raw = self._redis.get(key)
        existing = json.loads(existing_raw) if existing_raw else []
        existing.append(fp.to_dict())
        self._redis.set(key, json.dumps(existing))

    def _load_all_fingerprints(self) -> dict[str, list[ConversationFingerprint]]:
        if not self._use_redis:
            return self._store

        result = {}
        for raw_key in self._redis.scan_iter("groomer:*:fps"):
            groomer_id = raw_key.split(":")[1]
            raw = self._redis.get(raw_key)
            if raw:
                fps = [
                    ConversationFingerprint(**d) for d in json.loads(raw)
                ]
                result[groomer_id] = fps
        return result