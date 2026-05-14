"""
preprocess.py — Convert PAN-2012 XML dataset → labelled JSONL for train.py

What it does:
  1. Parses the training XML (66,927 conversations)
  2. Loads the predator ID list
  3. For each conversation involving a predator, builds sliding windows
     of messages and auto-labels them using keyword heuristics
  4. Samples a balanced set of safe (all-zero label) conversations
  5. Writes everything to data/dataset.jsonl

Labels (multi-label, order fixed):
  [trust_building, isolation, desensitization, solicitation, platform_switch]

Usage:
  python -m cura.ml.preprocess \
      --xml   data/raw/pan12-training.xml \
      --pred  data/raw/predators.txt \
      --out   data/dataset.jsonl \
      --window 10
"""

import re
import json
import html
import random
import argparse
import logging
import xml.etree.ElementTree as ET
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

random.seed(42)

# ── Label indices ──────────────────────────────────────────────────────────
LABEL_NAMES = ["trust_building", "isolation", "desensitization", "solicitation", "platform_switch"]

# ── Keyword heuristics for auto-labelling ─────────────────────────────────
# Each entry: (label_index, compiled_regex)
# These fire on the PREDATOR's text inside a window.
_F = re.IGNORECASE

LABEL_PATTERNS = [
    # 0 trust_building
    (0, re.compile(
        r"\b(you are (so |really )?(special|mature|beautiful|pretty|cute|smart)|"
        r"i (really )?like you|you (re|are) not like other|"
        r"i (feel|think) we (really )?connect|"
        r"i (want to|wanna) (spoil|treat|buy|get) you|"
        r"you can trust me|i understand you|"
        r"i (thought|think) about you|you mean (a lot|so much) to me)\b", _F)),

    # 1 isolation
    (1, re.compile(
        r"\b(don.?t tell (your )?(mom|dad|parents?|family|friends?|anyone)|"
        r"keep (this|it|our (chat|convo|conversation|secret)) (between us|secret|private|to yourself)|"
        r"our (little )?secret|no one (has to|needs to) know|"
        r"just between (you and me|us)|delete (this|these) messages?|"
        r"your (parents?|mom|dad|family) (don.?t|wouldn.?t) understand|"
        r"they.?re (too strict|controlling|overprotective)|"
        r"you don.?t need (them|your (family|friends))|"
        r"i (understand|get) you better than (they do|your (friends|parents)))\b", _F)),

    # 2 desensitization
    (2, re.compile(
        r"\b(have you (ever )?(kissed|had sex|done it|been with)|"
        r"do you have a (boyfriend|girlfriend)|"
        r"i could be your (boyfriend|girlfriend)|"
        r"let.?s talk about something (more )?(grown.?up|adult|mature)|"
        r"have you (ever )?(seen|watched) (adult|porn|xxx)|"
        r"you (are|re) old enough|i can (show|teach) you|"
        r"what are you (wearing|dressed in)|"
        r"are you (in bed|alone in your room))\b", _F)),

    # 3 solicitation
    (3, re.compile(
        r"\b(send (me )?(a )?(pic|photo|picture|selfie|nude|nudes?)|"
        r"show me (your|a)|"
        r"(video ?(call|chat)|facetime|cam) (me|with me)|"
        r"do you (sext|send nudes?)|"
        r"can i see (you|a pic)|"
        r"let.?s (cam|video|facetime))\b", _F)),

    # 4 platform_switch
    (4, re.compile(
        r"\b(add me on|find me on|message me on|text me on|dm me on|"
        r"hit me up on|reach me on|contact me on|"
        r"let.?s (move|chat|talk|switch) (to |on )?(a different|another)?\s?"
        r"(platform|app|place)?\s*"
        r"(whatsapp|telegram|signal|snapchat|discord|kik|wechat|"
        r"instagram|tiktok|line|viber|skype|wickr|threema)?|"
        r"(whatsapp|telegram|signal|snapchat|discord|kik|wechat|"
        r"instagram|tiktok|line|viber|skype|wickr|threema) (me|instead)|"
        r"give me your (number|phone|cell|mobile)|"
        r"what.?s your (number|phone|cell)|"
        r"text me|call me outside (here|this))\b", _F)),
]


def clean(text: str) -> str:
    """Unescape HTML entities and strip whitespace."""
    return html.unescape(text or "").strip()


def auto_label(predator_texts: list[str]) -> list[int]:
    """
    Given the predator's messages in a window, return a multi-hot label vector.
    """
    combined = " ".join(predator_texts).lower()
    labels = [0] * len(LABEL_NAMES)
    for idx, pattern in LABEL_PATTERNS:
        if pattern.search(combined):
            labels[idx] = 1
    return labels


def build_window_text(messages: list[dict], predator_ids: set) -> str:
    """
    Flatten a window of messages into model input text.
    Format: [SUSPECT] text  [CHILD] text ...
    """
    parts = []
    for m in messages:
        role = "[SUSPECT]" if m["author"] in predator_ids else "[CHILD]"
        if m["text"]:
            parts.append(f"{role} {m['text']}")
    return "  ".join(parts)


def parse_conversations(xml_path: str, predator_ids: set, window: int = 10):
    """
    Parse XML and yield (conversation_id, windows) for predator conversations.
    Each window is a list of message dicts.
    """
    logger.info(f"Parsing XML: {xml_path}")
    tree = ET.parse(xml_path)
    root = tree.getroot()
    convs = root.findall("conversation")
    logger.info(f"Total conversations: {len(convs)}")

    pred_convs, safe_convs = [], []

    for conv in convs:
        conv_id = conv.get("id", "")
        messages = []
        for m in conv.findall("message"):
            author = m.findtext("author", "").strip()
            text = clean(m.findtext("text", ""))
            messages.append({"author": author, "text": text})

        authors = {m["author"] for m in messages}
        has_predator = bool(authors & predator_ids)

        if has_predator:
            pred_convs.append((conv_id, messages))
        else:
            safe_convs.append((conv_id, messages))

    logger.info(f"Predator conversations: {len(pred_convs)}")
    logger.info(f"Safe conversations: {len(safe_convs)}")
    return pred_convs, safe_convs


def process(args):
    # Load predator IDs
    pred_path = Path(args.pred)
    with open(pred_path) as f:
        predator_ids = set(l.strip() for l in f if l.strip())
    logger.info(f"Loaded {len(predator_ids)} predator IDs")

    pred_convs, safe_convs = parse_conversations(args.xml, predator_ids, args.window)

    records = []

    # ── Predator conversations → sliding windows ──────────────────────────
    for conv_id, messages in pred_convs:
        n = len(messages)
        if n < 3:
            continue

        # Slide a window of size `args.window` through the conversation
        step = max(1, args.window // 2)
        for start in range(0, max(1, n - args.window + 1), step):
            window_msgs = messages[start: start + args.window]

            predator_texts = [
                m["text"] for m in window_msgs if m["author"] in predator_ids
            ]
            if not predator_texts:
                continue

            labels = auto_label(predator_texts)
            text = build_window_text(window_msgs, predator_ids)

            # Only keep windows where at least one label fired
            # (unlabelled windows from predator convs are still grooming context
            #  but we skip them to avoid noisy negatives)
            if sum(labels) == 0:
                # Still include as a "grooming context" sample with trust_building=1
                # because any predator conversation has some grooming intent
                labels[0] = 1  # trust_building as minimum

            records.append({"text": text, "labels": labels, "conv_id": conv_id})

    logger.info(f"Generated {len(records)} positive/predator windows")

    # ── Safe conversations → balanced negatives ───────────────────────────
    # Sample ~40% of total records as safe negatives
    n_safe_needed = int(len(records) * 0.4)
    random.shuffle(safe_convs)

    safe_records = []
    for conv_id, messages in safe_convs:
        if len(safe_records) >= n_safe_needed:
            break
        n = len(messages)
        if n < 3:
            continue
        # Take one window from the middle of the safe conversation
        mid = max(0, n // 2 - args.window // 2)
        window_msgs = messages[mid: mid + args.window]
        text = build_window_text(window_msgs, predator_ids)
        safe_records.append({
            "text": text,
            "labels": [0, 0, 0, 0, 0],
            "conv_id": conv_id,
        })

    logger.info(f"Generated {len(safe_records)} safe/negative windows")

    all_records = records + safe_records
    random.shuffle(all_records)

    # Write JSONL (strip conv_id — not needed by train.py)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for r in all_records:
            f.write(json.dumps({"text": r["text"], "labels": r["labels"]}) + "\n")

    logger.info(f"✓ Wrote {len(all_records)} samples to {out_path}")

    # Label distribution summary
    from collections import Counter
    label_counts = Counter()
    for r in all_records:
        for i, v in enumerate(r["labels"]):
            if v:
                label_counts[LABEL_NAMES[i]] += 1
    logger.info("Label distribution:")
    for name in LABEL_NAMES:
        logger.info(f"  {name:25s}: {label_counts[name]:5d} ({100*label_counts[name]/len(all_records):.1f}%)")
    logger.info(f"  {'safe (all zeros)':25s}: {len(safe_records):5d} ({100*len(safe_records)/len(all_records):.1f}%)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess PAN-2012 → JSONL")
    parser.add_argument("--xml",    required=True, help="Path to PAN-2012 training XML")
    parser.add_argument("--pred",   required=True, help="Path to predators .txt file")
    parser.add_argument("--out",    default="data/dataset.jsonl")
    parser.add_argument("--window", type=int, default=10, help="Sliding window size (messages)")
    args = parser.parse_args()
    process(args)