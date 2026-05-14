"""
rules_engine.py — Hard-coded rule layer that runs BEFORE/AFTER the ML model.

Rules complement the neural model with deterministic, high-precision signals:
  - Platform-switch patterns (trying to move to another app/platform)
  - PII solicitation (asking for phone, address, location)
  - Age-gap probing ("how old are you?", "are you alone?")
  - Secrecy instructions ("don't tell your parents", "keep this between us")
  - Explicit content escalation keywords

Each rule carries a fixed risk score contribution (LOW=5, MEDIUM=15, HIGH=30).
Rules can ALSO override the risk level to HIGH regardless of cumulative score
when a HIGH-severity rule fires.

Usage:
  from ml.rules_engine import RulesEngine
  engine = RulesEngine()
  flags, bonus_score, force_high = engine.evaluate(text)
"""

import re
import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rule dataclass
# ---------------------------------------------------------------------------
@dataclass
class Rule:
    name: str
    pattern: re.Pattern
    score: int          # added to cumulative score when fired
    severity: str       # "LOW" | "MEDIUM" | "HIGH"
    force_high: bool = False   # if True, overrides risk level to HIGH immediately
    description: str = ""


@dataclass
class RuleResult:
    fired_rules: list = field(default_factory=list)   # list of Rule.name
    bonus_score: int = 0
    force_high: bool = False
    details: list = field(default_factory=list)       # human-readable explanations


# ---------------------------------------------------------------------------
# Rule definitions
# ---------------------------------------------------------------------------
_FLAGS = re.IGNORECASE

RULES: list[Rule] = [

    # ---- Platform switch -----------------------------------------------
    Rule(
        name="platform_switch_app",
        pattern=re.compile(
            r"\b(add me on|find me on|message me on|text me on|dm me on|"
            r"hit me up on|reach me on|contact me on|let['']?s (move|chat|talk) on)\b"
            r".{0,40}"
            r"\b(whatsapp|telegram|signal|snapchat|discord|kik|wechat|"
            r"instagram|tiktok|line|viber|skype|wickr|threema|element)\b",
            _FLAGS,
        ),
        score=30,
        severity="HIGH",
        force_high=True,
        description="Requesting platform migration to a private/encrypted channel",
    ),
    Rule(
        name="platform_switch_phone",
        pattern=re.compile(
            r"\b(give me your (number|phone|cell|mobile)|"
            r"send me your (number|phone)|"
            r"what[' ]?s your (number|phone|cell)|"
            r"text me|call me)\b",
            _FLAGS,
        ),
        score=30,
        severity="HIGH",
        force_high=True,
        description="Requesting personal phone number / off-platform contact",
    ),

    # ---- PII solicitation (via presidio-compatible categories) ----------
    Rule(
        name="pii_home_address",
        pattern=re.compile(
            r"\b(where do you live|your (home |house |full )?address|"
            r"what (street|city|town|suburb) (are you|do you live)|"
            r"drop your (location|addy|address)|"
            r"share your location)\b",
            _FLAGS,
        ),
        score=30,
        severity="HIGH",
        force_high=True,
        description="Soliciting home address / precise location",
    ),
    Rule(
        name="pii_school_location",
        pattern=re.compile(
            r"\b(what school (do you go|are you at)|"
            r"which school|your school name|"
            r"when do you (get out of school|finish school)|"
            r"walk home from school)\b",
            _FLAGS,
        ),
        score=15,
        severity="MEDIUM",
        description="Probing school location (can enable physical access to minor)",
    ),

    # ---- Age probing ---------------------------------------------------
    Rule(
        name="age_probe",
        pattern=re.compile(
            r"\b(how old are you|what[' ]?s your age|are you [0-9]{1,2}|"
            r"you look (young|cute|pretty) for your age|"
            r"you[' ]?re (so young|really young|very young))\b",
            _FLAGS,
        ),
        score=5,
        severity="LOW",
        description="Probing or commenting on the minor's age",
    ),

    # ---- Isolation / secrecy ------------------------------------------
    Rule(
        name="secrecy_instruction",
        pattern=re.compile(
            r"\b(don[' ]?t tell (your (mom|dad|parents|family|friends)|anyone)|"
            r"keep (this|it|our (chat|convo|conversation)) (between us|secret|private)|"
            r"our (little )?secret|"
            r"no one (has to|needs to) know|"
            r"just between (you and me|us)|"
            r"delete (this|these) messages?)\b",
            _FLAGS,
        ),
        score=30,
        severity="HIGH",
        force_high=True,
        description="Instructing the minor to maintain secrecy from trusted adults",
    ),
    Rule(
        name="isolation_family",
        pattern=re.compile(
            r"\b(your (parents?|mom|dad|family) (don[' ]?t|wouldn[' ]?t) understand|"
            r"they[' ]?re (too strict|controlling|overprotective)|"
            r"you don[' ]?t need (them|your family|your friends)|"
            r"i (understand|get) you better than (they do|your friends|your parents))\b",
            _FLAGS,
        ),
        score=15,
        severity="MEDIUM",
        description="Attempting to drive a wedge between the minor and trusted adults",
    ),

    # ---- Alone / home alone probing ------------------------------------
    Rule(
        name="alone_probe",
        pattern=re.compile(
            r"\b(are you (alone|home alone|by yourself)|"
            r"is anyone (home|there|around)|"
            r"when (are you|will you be) (alone|home alone|by yourself)|"
            r"parents? (home|around|there)\?)\b",
            _FLAGS,
        ),
        score=15,
        severity="MEDIUM",
        description="Probing whether the minor is unsupervised",
    ),

    # ---- Gift / grooming enticement -----------------------------------
    Rule(
        name="gift_enticement",
        pattern=re.compile(
            r"\b(i[' ]?ll (buy|get|send|give) you|"
            r"i want to (spoil|treat) you|"
            r"(amazon|gift) (card|voucher) for you|"
            r"i can (pay for|fund|support) you)\b",
            _FLAGS,
        ),
        score=15,
        severity="MEDIUM",
        description="Offering gifts or financial incentives",
    ),

    # ---- Meeting proposal ---------------------------------------------
    Rule(
        name="meeting_proposal",
        pattern=re.compile(
            r"\b(meet (up|me|in person)|"
            r"let[' ]?s (hang out|meet|get together|see each other)|"
            r"come (over|to my place|visit me)|"
            r"i[' ]?ll (come to you|pick you up|drive you))\b",
            _FLAGS,
        ),
        score=30,
        severity="HIGH",
        force_high=True,
        description="Proposing an in-person meeting",
    ),

    # ---- Explicit content escalation ----------------------------------
    # Note: patterns deliberately kept non-explicit here; the ML model
    # handles nuanced desensitization; rules catch hard keywords.
    Rule(
        name="explicit_content_request",
        pattern=re.compile(
            r"\b(send (me )?(a )?(pic|photo|picture|photo|selfie|nude|nudes?)|"
            r"show me (your|a)|"
            r"video (call|chat) me|"
            r"do you (sext|send nudes?))\b",
            _FLAGS,
        ),
        score=30,
        severity="HIGH",
        force_high=True,
        description="Explicit content request or solicitation",
    ),
]


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
class RulesEngine:
    """
    Deterministic rule-based layer for grooming detection.

    Designed to complement the ML model:
      - High precision on hard keyword patterns
      - Instant HIGH escalation for unambiguous abuse signals
      - PII detection (complementary to presidio for inline use)
    """

    def __init__(self, rules: Optional[list[Rule]] = None):
        self.rules = rules if rules is not None else RULES
        logger.info(f"RulesEngine initialised with {len(self.rules)} rules.")

    def evaluate(self, text: str) -> RuleResult:
        """
        Evaluate all rules against the given text.

        Returns:
            RuleResult with fired rule names, bonus score, and force_high flag
        """
        result = RuleResult()

        for rule in self.rules:
            if rule.pattern.search(text):
                result.fired_rules.append(rule.name)
                result.bonus_score += rule.score
                if rule.force_high:
                    result.force_high = True
                result.details.append(
                    f"[{rule.severity}] {rule.name}: {rule.description}"
                )
                logger.debug(f"Rule fired: {rule.name}")

        return result

    def get_rule_names(self) -> list[str]:
        return [r.name for r in self.rules]

    def get_rule(self, name: str) -> Optional[Rule]:
        for r in self.rules:
            if r.name == name:
                return r
        return None


# ---------------------------------------------------------------------------
# Standalone CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse, json

    parser = argparse.ArgumentParser(description="Run rule engine on text")
    parser.add_argument("--text", required=True, help="Conversation text to evaluate")
    args = parser.parse_args()

    engine = RulesEngine()
    result = engine.evaluate(args.text)

    print(json.dumps({
        "fired_rules": result.fired_rules,
        "bonus_score": result.bonus_score,
        "force_high": result.force_high,
        "details": result.details,
    }, indent=2))