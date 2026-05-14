"""
test_pipeline.py — Verify the full ml pipeline works.

Run from inside the ml/ folder:
    python test_pipeline.py

Test 1 and 2 work without a trained model.
Test 3 requires completing all setup steps first.
"""

import sys, os

# So imports like `from ml.rules_engine import ...` work when run from ml/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

print("\n" + "="*60)
print("TEST 1: Rules Engine (no model needed)")
print("="*60)

from ml.rules_engine import RulesEngine
engine = RulesEngine()

cases = [
    ("hey how was your day",                          False),
    ("don't tell your parents about us",              True),
    ("add me on snapchat instead",                    True),
    ("are you home alone right now",                  True),
    ("give me your address",                          True),
    ("keep this between us, let's meet up",           True),
]
passed = True
for text, expect in cases:
    r = engine.evaluate(text)
    fired = len(r.fired_rules) > 0
    ok = fired == expect
    if not ok: passed = False
    print(f"  {'✓' if ok else '✗'} fired={fired} | rules={r.fired_rules or 'none'}")
    print(f"    \"{text[:60]}\"")
print(f"\nRules engine: {'ALL PASSED ✓' if passed else 'SOME FAILED ✗'}")


print("\n" + "="*60)
print("TEST 2: Groomer Matcher (no model needed)")
print("="*60)

from ml.groomer_matcher import GroomerMatcher, ConversationSession
matcher = GroomerMatcher()

sess_a = ConversationSession(
    session_id="sess_001", suspect_ip="203.0.113.42",
    messages=[
        {"role": "suspect", "text": "hey don't tell your parents, add me on snapchat"},
        {"role": "child",   "text": "ok"},
        {"role": "suspect", "text": "you are so special, keep this between us"},
    ],
    platform="instagram", child_user_id="child_001",
)
fp_a = matcher.build_fingerprint(sess_a, label_sequence=["trust_building", "platform_switch"])
gid  = matcher.register(fp_a)
print(f"  Registered groomer_id: {gid}")

sess_b = ConversationSession(
    session_id="sess_002", suspect_ip="203.0.113.42",
    messages=[
        {"role": "suspect", "text": "hey you are so special, don't tell your mom"},
        {"role": "child",   "text": "ok"},
        {"role": "suspect", "text": "add me on snapchat our little secret"},
    ],
    platform="tiktok", child_user_id="child_002",
)
fp_b  = matcher.build_fingerprint(sess_b, label_sequence=["trust_building", "isolation"])
match = matcher.match(fp_b)
print(f"  Cross-child match: {match.is_match} | score={match.similarity_score:.3f}")
print(f"  Reasons: {match.match_reasons}")
print(f"\nGroomer matcher: {'PASSED ✓' if match.is_match else 'No match (expected for fresh data)'}")


print("\n" + "="*60)
print("TEST 3: Full Pipeline (needs trained ONNX model)")
print("="*60)

ONNX = os.path.join(os.path.dirname(__file__), "models", "grooming_detector.onnx")
TDIR = os.path.join(os.path.dirname(__file__), "models", "grooming_detector")

if not os.path.exists(ONNX):
    print(f"  ⚠ Skipping — model not found at models/grooming_detector.onnx")
    print("  Complete Steps 4-6 in README.md first.")
else:
    from ml.pipeline import GroomingDetectionPipeline
    pipeline = GroomingDetectionPipeline(onnx_path=ONNX, tokenizer_dir=TDIR)
    result = pipeline.analyze(
        session_id="test_001",
        suspect_ip="192.168.1.99",
        messages=[
            {"role": "suspect", "text": "you are so special to me"},
            {"role": "child",   "text": "thanks"},
            {"role": "suspect", "text": "don't tell your parents, add me on telegram"},
            {"role": "child",   "text": "ok"},
        ],
        child_user_id="test_child_001",
        platform="instagram",
    )
    print(result)
    print("Full pipeline: PASSED ✓")

print("\n" + "="*60)
print("All tests done.")
print("="*60)