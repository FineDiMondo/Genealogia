from __future__ import annotations

import asyncio
import os
from datetime import datetime
from uuid import uuid4

from .audit_logger import AuditLogger
from .conflict_resolver import resolve_conflicts
from .data_models import NormalizationChange, NormalizedPerson, SourceAttribution
from .quality_control import compute_confidence, should_auto_approve
from ..rules.date_rules import DateNormalizer
from ..rules.name_rules import NameNormalizer
from ..rules.place_rules import PlaceNormalizer
from ..rules.relationship_rules import validate_relationships


class DataNormalizationEngine:
    def __init__(self, auto_approve_threshold: float = 0.85) -> None:
        self.auto_approve_threshold = auto_approve_threshold
        self.audit = AuditLogger()
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()

    async def normalize_batch(self, records: list[dict], source: str = "local") -> tuple[list[NormalizedPerson], list[dict]]:
        normalized: list[NormalizedPerson] = []
        flagged: list[dict] = []
        for record in records:
            person = await self.normalize_record(record, source=source)
            normalized.append(person)
            if person.flagged_for_review:
                flagged.append({"person_id": person.person_id, "reasons": person.conflict_reasons, "confidence": person.confidence})
        return normalized, flagged

    async def normalize_record(self, record: dict, source: str = "local") -> NormalizedPerson:
        person_id = str(record.get("person_id") or record.get("id") or f"P{uuid4().hex[:8]}").strip()

        name = NameNormalizer.normalize(str(record.get("given_names", "")), str(record.get("family_name", "")))
        birth = DateNormalizer.normalize(str(record.get("birth_date", "")))
        death = DateNormalizer.normalize(str(record.get("death_date", "")))
        birth_place = PlaceNormalizer.normalize(str(record.get("birth_place", "")))
        death_place = PlaceNormalizer.normalize(str(record.get("death_place", "")))

        rel_ok, rel_issues = validate_relationships(
            {
                "person_id": person_id,
                "parents": record.get("parents", []),
                "spouse": record.get("spouse", []),
                "children": record.get("children", []),
            }
        )
        _, conflict_reasons = resolve_conflicts(rel_issues if not rel_ok else [])

        scores = [
            float(name["confidence"]),
            float(birth["confidence"]),
            float(death["confidence"]) if death["date"] else 1.0,
            float(birth_place["confidence"]) if birth_place["place"] else 1.0,
            float(death_place["confidence"]) if death_place["place"] else 1.0,
            1.0 if rel_ok else 0.5,
        ]
        confidence = compute_confidence(scores)
        flagged = not should_auto_approve(confidence, self.auto_approve_threshold) or bool(conflict_reasons)

        changes = [
            NormalizationChange(
                field="given_names",
                original_value=str(record.get("given_names", "")),
                normalized_value=name["given_names"],
                rule_applied="name_rules.normalize",
                confidence=name["confidence"],
                sources=[source],
                rationale="standardized_given_names",
            ),
            NormalizationChange(
                field="family_name",
                original_value=str(record.get("family_name", "")),
                normalized_value=name["family_name"],
                rule_applied="name_rules.normalize",
                confidence=name["confidence"],
                sources=[source],
                rationale="standardized_family_name",
            ),
        ]

        result = NormalizedPerson(
            person_id=person_id,
            given_names=name["given_names"],
            family_name=name["family_name"],
            name_variants=name["variants"],
            birth_date=birth["date"],
            birth_place=birth_place["place"],
            death_date=death["date"],
            death_place=death_place["place"],
            parents=list(record.get("parents", [])),
            spouse=list(record.get("spouse", [])),
            children=list(record.get("children", [])),
            sources=[
                SourceAttribution(
                    source_system=source,
                    source_id=str(record.get("source_id", person_id)),
                    original_value=str(record),
                    confidence=confidence,
                    date_extracted=datetime.now().isoformat(),
                )
            ],
            changes=changes,
            confidence=confidence,
            flagged_for_review=flagged,
            conflict_reasons=conflict_reasons,
            audit_id=uuid4().hex,
            processed_at=datetime.now().isoformat(),
        )
        result.validate()
        self.audit.write("normalized_record", {"person_id": result.person_id, "confidence": result.confidence, "flagged": result.flagged_for_review})
        await asyncio.sleep(0)
        return result

