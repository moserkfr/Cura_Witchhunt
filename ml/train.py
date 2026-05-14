"""
train.py — Fine-tune distilBERT/RoBERTa for multi-label grooming detection.

Labels (multi-label, not mutually exclusive):
  0: trust_building       — excessive flattery, gift offers, secret-keeping
  1: isolation            — cutting off from friends/family, private chat moves
  2: desensitization      — gradual boundary pushing, sexual topic introduction
  3: solicitation         — explicit content requests, meeting proposals
  4: platform_switch      — trying to move to another platform/app

Risk scoring:
  LOW    → score  5  (trust_building alone)
  MEDIUM → score 15  (isolation or desensitization)
  HIGH   → score 30  (solicitation or platform_switch)
"""

import os
import json
import logging
import argparse
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    get_linear_schedule_with_warmup,
)
from torch.optim import AdamW
from sklearn.metrics import (
    classification_report,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
LABEL_NAMES = [
    "trust_building",
    "isolation",
    "desensitization",
    "solicitation",
    "platform_switch",
]
NUM_LABELS = len(LABEL_NAMES)

LABEL_RISK_SCORES = {
    "trust_building": 5,      # LOW
    "isolation": 15,           # MEDIUM
    "desensitization": 15,     # MEDIUM
    "solicitation": 30,        # HIGH
    "platform_switch": 30,     # HIGH
}

RISK_THRESHOLDS = {
    "LOW": 5,
    "MEDIUM": 15,
    "HIGH": 30,
}

PARENT_ALERT_THRESHOLD = 30  # cumulative score to flag parent


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------
class GroomingDataset(Dataset):
    """
    Expects a pandas DataFrame with columns:
      - 'text'   : str, conversation window (e.g. last N turns concatenated)
      - 'labels' : list[int] of length NUM_LABELS, multi-hot encoded
    """

    def __init__(self, df: pd.DataFrame, tokenizer, max_len: int = 256):
        self.texts = df["text"].tolist()
        self.labels = df["labels"].tolist()
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        enc = self.tokenizer(
            self.texts[idx],
            max_length=self.max_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        return {
            "input_ids": enc["input_ids"].squeeze(0),
            "attention_mask": enc["attention_mask"].squeeze(0),
            "labels": torch.tensor(self.labels[idx], dtype=torch.float),
        }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def load_data(data_path: str) -> pd.DataFrame:
    """
    Load dataset from a JSONL file.
    Each line: {"text": "...", "labels": [0,1,0,0,1]}
    Compatible with PAN-2012 preprocessed exports and custom datasets.
    """
    records = []
    with open(data_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    df = pd.DataFrame(records)
    assert "text" in df.columns and "labels" in df.columns, (
        "Dataset must have 'text' and 'labels' columns."
    )
    logger.info(f"Loaded {len(df)} samples from {data_path}")
    return df


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Compute per-label and macro metrics. Recall is prioritised (child safety)."""
    metrics = {}
    for i, name in enumerate(LABEL_NAMES):
        metrics[name] = {
            "precision": precision_score(y_true[:, i], y_pred[:, i], zero_division=0),
            "recall": recall_score(y_true[:, i], y_pred[:, i], zero_division=0),
            "f1": f1_score(y_true[:, i], y_pred[:, i], zero_division=0),
        }
    metrics["macro"] = {
        "precision": precision_score(y_true, y_pred, average="macro", zero_division=0),
        "recall": recall_score(y_true, y_pred, average="macro", zero_division=0),
        "f1": f1_score(y_true, y_pred, average="macro", zero_division=0),
    }
    return metrics


def log_metrics(metrics: dict, split: str = "val"):
    logger.info(f"\n{'='*60}\n{split.upper()} METRICS\n{'='*60}")
    for label, vals in metrics.items():
        logger.info(
            f"  {label:20s} | P={vals['precision']:.3f}  R={vals['recall']:.3f}  F1={vals['f1']:.3f}"
        )
    logger.info("=" * 60)


# ---------------------------------------------------------------------------
# Training loop
# ---------------------------------------------------------------------------
def train(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")

    # --- Tokenizer & Model ---
    logger.info(f"Loading model: {args.model_name}")
    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.model_name,
        num_labels=NUM_LABELS,
        problem_type="multi_label_classification",
    )
    model.to(device)

    # --- Data ---
    df = load_data(args.data_path)
    train_df, val_df = train_test_split(df, test_size=0.15, random_state=42)
    train_ds = GroomingDataset(train_df, tokenizer, max_len=args.max_len)
    val_ds = GroomingDataset(val_df, tokenizer, max_len=args.max_len)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size)

    # --- Optimizer & Scheduler ---
    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    total_steps = len(train_loader) * args.epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(0.1 * total_steps),
        num_training_steps=total_steps,
    )

    # --- Class weights (imbalance correction, HIGH-risk labels weighted more) ---
    # solicitation and platform_switch get 2x weight
    pos_weight = torch.tensor([1.0, 1.5, 1.5, 2.0, 2.0], device=device)
    loss_fn = torch.nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    best_recall = 0.0

    for epoch in range(1, args.epochs + 1):
        # ---- Train ----
        model.train()
        total_loss = 0.0
        for batch in train_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            loss = loss_fn(outputs.logits, labels)

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()

            total_loss += loss.item()

        avg_loss = total_loss / len(train_loader)
        logger.info(f"Epoch {epoch}/{args.epochs} — train loss: {avg_loss:.4f}")

        # ---- Validate ----
        model.eval()
        all_preds, all_labels = [], []
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)

                outputs = model(input_ids=input_ids, attention_mask=attention_mask)
                preds = (torch.sigmoid(outputs.logits) >= args.threshold).int()

                all_preds.append(preds.cpu().numpy())
                all_labels.append(labels.cpu().numpy().astype(int))

        y_pred = np.vstack(all_preds)
        y_true = np.vstack(all_labels)
        metrics = compute_metrics(y_true, y_pred)
        log_metrics(metrics, split=f"epoch-{epoch}/val")

        # Save best model by macro recall (safety-critical: minimise false negatives)
        macro_recall = metrics["macro"]["recall"]
        if macro_recall > best_recall:
            best_recall = macro_recall
            os.makedirs(args.output_dir, exist_ok=True)
            model.save_pretrained(args.output_dir)
            tokenizer.save_pretrained(args.output_dir)
            logger.info(
                f"  ✓ New best recall={best_recall:.3f} — saved to {args.output_dir}"
            )

    logger.info(f"\nTraining complete. Best macro recall: {best_recall:.3f}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train grooming detection model")
    parser.add_argument(
        "--model_name",
        default="distilbert-base-uncased",
        help="HuggingFace model: distilbert-base-uncased or roberta-base",
    )
    parser.add_argument("--data_path", required=True, help="Path to JSONL dataset")
    parser.add_argument("--output_dir", default="models/grooming_detector")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--max_len", type=int, default=256)
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.4,
        help="Sigmoid threshold for positive label (lower = higher recall)",
    )
    args = parser.parse_args()
    train(args)