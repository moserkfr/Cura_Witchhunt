

suspicious_phrases = {
    "don't tell anyone": 40,
    "send me a photo": 35,
    "let's talk somewhere else": 30,
    "keep this secret": 40,
    "you are mature for your age": 30,
    "are you alone": 25
}


def analyze_message(message):

    message_lower = message.lower()

    risk_score = 0

    reasons = []

    # Check suspicious phrases
    for phrase, score in suspicious_phrases.items():

        if phrase in message_lower:

            risk_score += score

            reasons.append(f"Detected phrase: {phrase}")

    # Risk classification
    if risk_score >= 70:
        risk_level = "HIGH"

    elif risk_score >= 40:
        risk_level = "MEDIUM"

    else:
        risk_level = "LOW"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "reason": reasons
    }