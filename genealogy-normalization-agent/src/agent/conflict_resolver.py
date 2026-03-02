from __future__ import annotations

from .data_models import ConflictSeverity


def resolve_conflicts(issues: list[str]) -> tuple[ConflictSeverity, list[str]]:
    if not issues:
        return ConflictSeverity.LOW, []
    if any("self" in issue for issue in issues):
        return ConflictSeverity.HIGH, issues
    return ConflictSeverity.MEDIUM, issues

