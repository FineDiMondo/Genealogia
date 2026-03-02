from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any


class ConfidenceLevel(Enum):
    VERY_LOW = 0.0
    LOW = 0.25
    MEDIUM = 0.50
    HIGH = 0.75
    VERY_HIGH = 0.95


class ConflictSeverity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class NormalizationChange:
    field: str
    original_value: str
    normalized_value: str
    rule_applied: str
    confidence: float
    sources: list[str]
    rationale: str


@dataclass
class SourceAttribution:
    source_system: str
    source_id: str
    original_value: str
    confidence: float
    date_extracted: str


@dataclass
class NormalizedPerson:
    person_id: str
    given_names: str
    family_name: str
    name_variants: list[str] = field(default_factory=list)
    birth_date: str | None = None
    birth_place: str | None = None
    death_date: str | None = None
    death_place: str | None = None
    parents: list[str] = field(default_factory=list)
    spouse: list[str] = field(default_factory=list)
    children: list[str] = field(default_factory=list)
    sources: list[SourceAttribution] = field(default_factory=list)
    changes: list[NormalizationChange] = field(default_factory=list)
    confidence: float = 0.0
    flagged_for_review: bool = False
    conflict_reasons: list[str] = field(default_factory=list)
    audit_id: str = ""
    processed_at: str = ""

    def validate(self) -> None:
        if not self.person_id:
            raise ValueError("person_id required")
        if not (0.0 <= self.confidence <= 1.0):
            raise ValueError("confidence must be in [0,1]")

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

