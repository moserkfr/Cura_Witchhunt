"""
pipeline.py — Main entry point that wires together:
  1. RulesEngine       (rules_engine.py)
  2. GroomingInferenceEngine  (inference.py)
  3. GroomerMatcher    (groomer_matcher.py)

Your friend's project calls THIS file only.
Everything else is handled internally.

─────────────────────────────────────────────
USAGE (after setup):

    from ml.pipeline import GroomingDetectionPipeline

    pipeline = GroomingDetectionPipeline(
        onnx_path="models/grooming_detector.onnx",
        tokenizer_dir="models/grooming_detector",
    )

    result = pipeline.analyze(
        session_id="sess_001",
        suspect_ip="192.168.1.42",
        messages=[
            {"role": "suspect", "text": "hey don't tell your parents about this"},
            {"role": "child",   "text": "ok"},
            {"role": "suspect", "text": "add me on snapchat instead"},
        ],
        child_user_id="child_001",
        platform="instagram",
    )

    print(result)
─────────────────────────────────────────────
"""

import logging
from dataclasses import dataclass, field, asdict
import json

from .rules_engine import RulesEngine
from .inference import GroomingInferenceEngine
from .groomer_matcher import GroomerMatcher, ConversationSession

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Final result returned to the caller
# ---------------------------------------------------------------------------
@dataclass
class PipelineResult:
    # ── identifiers ──────────────────────────────────────────────────
    session_id: str = ""
    child_user_id: str = ""
    platform: str = ""

    # ── ML model output ───────────────────────────────────────────────
    triggered_labels: list = field(default_factory=list)
    label_probabilities: dict = field(default_factory=dict)

    # ── Rules output ──────────────────────────────────────────────────
    fired_rules: list = field(default_factory=list)
    rule_bonus_score: int = 0
    force_high: bool = False

    # ── Combined score & risk ─────────────────────────────────────────
    cumulative_score: int = 0
    risk_level: str = "NONE"       # "NONE" | "LOW" | "MEDIUM" | "HIGH"

    # ── Alert ─────────────────────────────────────────────────────────
    alert_parent: bool = False
    explanation: str = ""

    # ── Cross-child groomer match ─────────────────────────────────────
    cross_child_match: bool = False
    matched_groomer_id: str = ""
    groomer_similarity_score: float = 0.0
    groomer_match_reasons: list = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)

    def __str__(self) -> str:
        lines = [
            f"{'─'*50}",
            f"Session      : {self.session_id}",
            f"Child ID     : {self.child_user_id}",
            f"Platform     : {self.platform}",
            f"Risk level   : {self.risk_level}",
            f"Score        : {self.cumulative_score}",
            f"Alert parent : {'⚠ YES' if self.alert_parent else 'No'}",
            f"Labels       : {', '.join(self.triggered_labels) or 'none'}",
            f"Rules fired  : {', '.join(self.fired_rules) or 'none'}",
            f"Cross-child  : {'⚠ YES — ' + self.matched_groomer_id if self.cross_child_match else 'No'}",
            f"Explanation  : {self.explanation}",
            f"{'─'*50}",
        ]
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------
class GroomingDetectionPipeline:
    """
    Single class that your friend's project imports and calls.

    Args:
        onnx_path       : path to exported .onnx model file
        tokenizer_dir   : directory containing the HuggingFace tokenizer
        threshold       : sigmoid threshold for label activation (default 0.40)
        max_len         : tokenizer max length — must match training (default 256)
        use_redis       : set True in production for persistent groomer store
        redis_url       : Redis connection string (used only if use_redis=True)
        alert_threshold : cumulative score that triggers parent alert (default 30)
    """

    def __init__(
        self,
        onnx_path: str,
        tokenizer_dir: str,
        threshold: float = 0.40,
        max_len: int = 256,
        use_redis: bool = False,
        redis_url: str = "redis://localhost:6379/0",
        alert_threshold: int = 30,
    ):
        self.alert_threshold = alert_threshold

        logger.info("Initialising GroomingDetectionPipeline…")
        self.rules_engine = RulesEngine()
        self.inference_engine = GroomingInferenceEngine(
            onnx_path=onnx_path,
            tokenizer_dir=tokenizer_dir,
            threshold=threshold,
            max_len=max_len,
        )
        self.groomer_matcher = GroomerMatcher(use_redis=use_redis, redis_url=redis_url)
        logger.info("Pipeline ready.")

    # ------------------------------------------------------------------
    def _build_conversation_text(self, messages: list[dict]) -> str:
        """
        Flatten messages into a single string for the model.
        Format:  [SUSPECT] text  [CHILD] text  ...
        """
        parts = []
        for m in messages:
            role_tag = "[SUSPECT]" if m.get("role") == "suspect" else "[CHILD]"
            parts.append(f"{role_tag} {m.get('text', '').strip()}")
        return "  ".join(parts)

    # ------------------------------------------------------------------
    def analyze(
        self,
        session_id: str,
        suspect_ip: str,
        messages: list[dict],
        child_user_id: str = "",
        platform: str = "unknown",
        timestamps: list = None,
    ) -> PipelineResult:
        """
        Run the full detection pipeline on one conversation window.

        Args:
            session_id      : unique ID for this conversation session
            suspect_ip      : IP address of the adult-side user
            messages        : list of {"role": "suspect"|"child", "text": str}
            child_user_id   : anonymised ID of the child (e.g. hashed username)
            platform        : platform name (e.g. "instagram", "discord")
            timestamps      : optional list of Unix timestamps per message

        Returns:
            PipelineResult
        """
        timestamps = timestamps or []
        conversation_text = self._build_conversation_text(messages)

        # ── Step 1: Rules engine ──────────────────────────────────────
        rule_result = self.rules_engine.evaluate(conversation_text)

        # ── Step 2: ML inference ──────────────────────────────────────
        inference_result = self.inference_engine.predict(
            conversation_text=conversation_text,
            rule_flags=rule_result.fired_rules,
            rule_score_bonus=rule_result.bonus_score,
        )

        # ── Step 3: Override risk to HIGH if rules force it ───────────
        risk_level = inference_result.risk_level
        cumulative_score = inference_result.cumulative_score
        if rule_result.force_high:
            risk_level = "HIGH"
            cumulative_score = max(cumulative_score, 30)

        alert_parent = cumulative_score >= self.alert_threshold

        # ── Step 4: Build groomer fingerprint + cross-child match ─────
        session = ConversationSession(
            session_id=session_id,
            suspect_ip=suspect_ip,
            messages=messages,
            platform=platform,
            timestamps=timestamps,
            child_user_id=child_user_id,
        )
        fingerprint = self.groomer_matcher.build_fingerprint(
            session,
            label_sequence=inference_result.triggered_labels,
        )
        match_result = self.groomer_matcher.match(fingerprint)

        # Register fingerprint (store it for future matching)
        groomer_id = None
        if match_result.is_match:
            groomer_id = match_result.matched_groomer_id
        self.groomer_matcher.register(fingerprint, groomer_id)

        # ── Step 5: Assemble final result ─────────────────────────────
        return PipelineResult(
            session_id=session_id,
            child_user_id=child_user_id,
            platform=platform,
            triggered_labels=inference_result.triggered_labels,
            label_probabilities=inference_result.probabilities,
            fired_rules=rule_result.fired_rules,
            rule_bonus_score=rule_result.bonus_score,
            force_high=rule_result.force_high,
            cumulative_score=cumulative_score,
            risk_level=risk_level,
            alert_parent=alert_parent,
            explanation=inference_result.explanation,
            cross_child_match=match_result.is_match,
            matched_groomer_id=match_result.matched_groomer_id or "",
            groomer_similarity_score=match_result.similarity_score,
            groomer_match_reasons=match_result.match_reasons,
        )