from __future__ import annotations


def compute_confidence(scores: list[float]) -> float:
    if not scores:
        return 0.0
    safe = [max(0.0, min(1.0, s)) for s in scores]
    return round(sum(safe) / len(safe), 4)


def should_auto_approve(confidence: float, threshold: float = 0.85) -> bool:
    return confidence >= threshold

