"""
inference.py — Fast local inference via ONNX export.

Pipeline:
  1. Load ONNX model (exported from trained PyTorch checkpoint)
  2. Run multi-label classification on a conversation window
  3. Apply rules_engine overtop for hard-coded signal amplification
  4. Return structured result: labels, scores, risk level, alert flag

Usage:
  from ml.inference import GroomingInferenceEngine
  engine = GroomingInferenceEngine("models/grooming_detector.onnx",
                                   "models/grooming_detector/")
  result = engine.predict(conversation_window)
  print(result)
"""

import os
import json
import logging
import numpy as np
from dataclasses import dataclass, field, asdict
from typing import Optional

import onnxruntime as ort
from transformers import AutoTokenizer

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants (must stay in sync with train.py)
# ---------------------------------------------------------------------------
LABEL_NAMES = [
    "trust_building",
    "isolation",
    "desensitization",
    "solicitation",
    "platform_switch",
]

LABEL_RISK_SCORES = {
    "trust_building": 5,
    "isolation": 15,
    "desensitization": 15,
    "solicitation": 30,
    "platform_switch": 30,
}

RISK_LEVELS = [
    (30, "HIGH"),
    (15, "MEDIUM"),
    (5,  "LOW"),
    (0,  "NONE"),
]

PARENT_ALERT_THRESHOLD = 30


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------
@dataclass
class InferenceResult:
    # Raw model probabilities per label
    probabilities: dict = field(default_factory=dict)          # {label: float}
    # Labels that fired above threshold
    triggered_labels: list = field(default_factory=list)       # [str, ...]
    # Per-label risk score contribution
    label_scores: dict = field(default_factory=dict)           # {label: int}
    # Cumulative risk score
    cumulative_score: int = 0
    # Risk level string
    risk_level: str = "NONE"
    # Whether parent should be alerted
    alert_parent: bool = False
    # Rule-engine additions (from rules_engine.py)
    rule_flags: list = field(default_factory=list)
    # Explanation string
    explanation: str = ""

    def to_dict(self):
        return asdict(self)

    def to_json(self):
        return json.dumps(self.to_dict(), indent=2)


# ---------------------------------------------------------------------------
# ONNX export helper (run once after training)
# ---------------------------------------------------------------------------
def export_to_onnx(
    model_dir: str,
    onnx_path: str,
    max_len: int = 256,
):
    """
    Export a saved HuggingFace model to ONNX for fast CPU inference.
    Call this once after training completes.

    Args:
        model_dir:  directory with config.json + pytorch_model.bin
        onnx_path:  output .onnx file path
        max_len:    sequence length used during training
    """
    import torch
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    logger.info(f"Exporting model from {model_dir} → {onnx_path}")
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(model_dir)
    model.eval()

    dummy_input = tokenizer(
        "hello",
        max_length=max_len,
        padding="max_length",
        truncation=True,
        return_tensors="pt",
    )

    os.makedirs(os.path.dirname(onnx_path) or ".", exist_ok=True)
    torch.onnx.export(
        model,
        (dummy_input["input_ids"], dummy_input["attention_mask"]),
        onnx_path,
        input_names=["input_ids", "attention_mask"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch"},
            "attention_mask": {0: "batch"},
        },
        opset_version=14,
    )
    logger.info("ONNX export complete.")


# ---------------------------------------------------------------------------
# Inference engine
# ---------------------------------------------------------------------------
class GroomingInferenceEngine:
    """
    Wraps ONNX runtime + tokenizer for production inference.

    Args:
        onnx_path:      path to .onnx model file
        tokenizer_dir:  HuggingFace tokenizer directory
        threshold:      sigmoid threshold for label activation
        max_len:        max token length (must match training)
    """

    def __init__(
        self,
        onnx_path: str,
        tokenizer_dir: str,
        threshold: float = 0.40,
        max_len: int = 256,
    ):
        if not os.path.exists(onnx_path):
            raise FileNotFoundError(f"ONNX model not found: {onnx_path}")

        # CPU-optimised session
        sess_options = ort.SessionOptions()
        sess_options.intra_op_num_threads = os.cpu_count() or 4
        sess_options.graph_optimization_level = (
            ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        )
        self.session = ort.InferenceSession(
            onnx_path,
            sess_options=sess_options,
            providers=["CPUExecutionProvider"],
        )

        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_dir)
        self.threshold = threshold
        self.max_len = max_len
        logger.info(
            f"GroomingInferenceEngine ready | threshold={threshold} | max_len={max_len}"
        )

    # ------------------------------------------------------------------
    def _tokenize(self, text: str) -> dict:
        enc = self.tokenizer(
            text,
            max_length=self.max_len,
            padding="max_length",
            truncation=True,
            return_tensors="np",
        )
        return {
            "input_ids": enc["input_ids"].astype(np.int64),
            "attention_mask": enc["attention_mask"].astype(np.int64),
        }

    # ------------------------------------------------------------------
    def _sigmoid(self, x: np.ndarray) -> np.ndarray:
        return 1.0 / (1.0 + np.exp(-x))

    # ------------------------------------------------------------------
    def predict(
        self,
        conversation_text: str,
        rule_flags: Optional[list] = None,
        rule_score_bonus: int = 0,
    ) -> InferenceResult:
        """
        Run inference on a conversation window.

        Args:
            conversation_text:  concatenated chat turns (see groomer_matcher.py
                                for windowing strategy)
            rule_flags:         list of rule names that fired (from rules_engine)
            rule_score_bonus:   extra score added by rule-based layer

        Returns:
            InferenceResult
        """
        rule_flags = rule_flags or []

        # 1. Tokenise
        inputs = self._tokenize(conversation_text)

        # 2. ONNX forward pass
        logits = self.session.run(
            ["logits"],
            {
                "input_ids": inputs["input_ids"],
                "attention_mask": inputs["attention_mask"],
            },
        )[0][0]  # shape: (num_labels,)

        probs = self._sigmoid(logits)

        # 3. Apply threshold
        triggered = [
            LABEL_NAMES[i]
            for i, p in enumerate(probs)
            if p >= self.threshold
        ]

        # 4. Score accumulation
        label_scores = {lbl: LABEL_RISK_SCORES[lbl] for lbl in triggered}
        cumulative = sum(label_scores.values()) + rule_score_bonus

        # 5. Risk level
        risk_level = "NONE"
        for min_score, level in RISK_LEVELS:
            if cumulative >= min_score:
                risk_level = level
                break

        # 6. Alert decision
        alert_parent = cumulative >= PARENT_ALERT_THRESHOLD

        # 7. Human-readable explanation
        parts = []
        if triggered:
            parts.append(f"Model detected: {', '.join(triggered)}.")
        if rule_flags:
            parts.append(f"Rules triggered: {', '.join(rule_flags)}.")
        parts.append(
            f"Cumulative score: {cumulative} → {risk_level} risk."
        )
        if alert_parent:
            parts.append("⚠ Parent alert threshold reached.")

        return InferenceResult(
            probabilities={
                LABEL_NAMES[i]: round(float(probs[i]), 4) for i in range(len(LABEL_NAMES))
            },
            triggered_labels=triggered,
            label_scores=label_scores,
            cumulative_score=cumulative,
            risk_level=risk_level,
            alert_parent=alert_parent,
            rule_flags=rule_flags,
            explanation=" ".join(parts),
        )

    # ------------------------------------------------------------------
    def predict_batch(self, texts: list[str]) -> list[InferenceResult]:
        """Run inference on a list of conversation windows."""
        return [self.predict(t) for t in texts]


# ---------------------------------------------------------------------------
# CLI helper
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run grooming detection inference")
    parser.add_argument("--onnx_path", required=True)
    parser.add_argument("--tokenizer_dir", required=True)
    parser.add_argument("--text", type=str, help="Single conversation text")
    parser.add_argument("--threshold", type=float, default=0.40)
    parser.add_argument(
        "--export_from",
        type=str,
        default=None,
        help="If set, export this HF model dir to --onnx_path first",
    )
    args = parser.parse_args()

    if args.export_from:
        export_to_onnx(args.export_from, args.onnx_path)

    if args.text:
        engine = GroomingInferenceEngine(
            args.onnx_path, args.tokenizer_dir, threshold=args.threshold
        )
        result = engine.predict(args.text)
        print(result.to_json())