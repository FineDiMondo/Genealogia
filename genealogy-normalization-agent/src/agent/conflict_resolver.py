from __future__ import annotations

from dataclasses import replace
from typing import Any

from .data_models import ConflictSeverity
from .data_models import NormalizedPerson


class ConflictResolver:
    """
    Deterministic conflict resolver for genealogy normalization workflows.
    """

    @staticmethod
    def categorize_conflict(person: NormalizedPerson) -> dict[str, Any]:
        reasons = person.conflict_reasons or []
        confidence = float(person.confidence)

        if any("self" in r.lower() for r in reasons):
            severity = "HIGH"
            ctype = "relationship_inconsistency"
            recommendation = "REVIEW"
            auto_resolvable = False
        elif confidence >= 0.85 and not reasons:
            severity = "LOW"
            ctype = "none"
            recommendation = "APPROVE"
            auto_resolvable = True
        elif confidence >= 0.70:
            severity = "MEDIUM"
            ctype = "source_conflict"
            recommendation = "REVIEW"
            auto_resolvable = True
        else:
            severity = "CRITICAL"
            ctype = "low_confidence"
            recommendation = "REVIEW"
            auto_resolvable = False

        return {
            "severity": severity,
            "type": ctype,
            "reason": "; ".join(reasons) if reasons else "No explicit conflicts, confidence-based classification",
            "auto_resolvable": auto_resolvable,
            "recommendation": recommendation,
        }

    @staticmethod
    def auto_resolve_low_confidence(person: NormalizedPerson) -> NormalizedPerson:
        """
        Apply conservative fallback heuristics for low confidence records.
        """
        # Conservative behavior: never auto-resolve hard conflicts.
        category = ConflictResolver.categorize_conflict(person)
        if category["severity"] in {"CRITICAL", "HIGH"}:
            return person

        # Improve confidence slightly if core fields are complete.
        score_bonus = 0.0
        if person.given_names and person.family_name:
            score_bonus += 0.03
        if person.birth_date:
            score_bonus += 0.02
        if person.birth_place:
            score_bonus += 0.02
        new_conf = min(1.0, person.confidence + score_bonus)
        return replace(person, confidence=new_conf, flagged_for_review=(new_conf < 0.85))

    @staticmethod
    def generate_review_recommendations(person: NormalizedPerson) -> dict[str, Any]:
        category = ConflictResolver.categorize_conflict(person)
        complete_fields = sum(
            1
            for v in [person.given_names, person.family_name, person.birth_date, person.birth_place, person.death_date, person.death_place]
            if v
        )
        quality = "HIGH" if complete_fields >= 5 else "MEDIUM" if complete_fields >= 3 else "LOW"
        sources_agreement = "LOW" if person.conflict_reasons else "HIGH"
        if category["severity"] in {"CRITICAL", "HIGH"}:
            action = "REJECT_OR_MANUAL_REVIEW"
        elif person.confidence >= 0.85:
            action = "APPROVE"
        else:
            action = "REVIEW"

        return {
            "recommendation": category["recommendation"],
            "confidence_analysis": f"confidence={person.confidence:.2f}, severity={category['severity']}",
            "data_quality": quality,
            "sources_agreement": sources_agreement,
            "suggested_action": action,
        }

    @staticmethod
    def merge_conflicting_sources(person: NormalizedPerson) -> NormalizedPerson:
        """
        Deterministic merge strategy:
        - keep normalized values
        - preserve all name variants
        - clear duplicate conflict messages
        """
        unique_variants = list(dict.fromkeys([x for x in person.name_variants if x]))
        unique_reasons = sorted(set(person.conflict_reasons))
        return replace(person, name_variants=unique_variants, conflict_reasons=unique_reasons)


def resolve_conflicts(issues: list[str]) -> tuple[ConflictSeverity, list[str]]:
    if not issues:
        return ConflictSeverity.LOW, []
    if any("self" in issue for issue in issues):
        return ConflictSeverity.HIGH, issues
    return ConflictSeverity.MEDIUM, issues
