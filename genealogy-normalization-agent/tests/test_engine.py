from __future__ import annotations

import asyncio

from src.agent.normalization_engine import DataNormalizationEngine


def test_normalize_record_smoke() -> None:
    engine = DataNormalizationEngine()
    payload = {
        "person_id": "PTEST01",
        "given_names": "PIETRO",
        "family_name": "d'agostino",
        "birth_date": "15 MAR 1500",
        "birth_place": "Palermo",
    }
    out = asyncio.run(engine.normalize_record(payload, source="test"))
    assert out.person_id == "PTEST01"
    assert out.family_name == "Agostino"
    assert out.birth_date == "1500-03-15"
    assert out.birth_place == "Palermo, Sicilia, Italia"


def test_normalize_batch_returns_lists() -> None:
    engine = DataNormalizationEngine()
    payload = [{"person_id": "P1", "given_names": "A", "family_name": "B"}]
    normalized, flagged = asyncio.run(engine.normalize_batch(payload))
    assert len(normalized) == 1
    assert isinstance(flagged, list)

