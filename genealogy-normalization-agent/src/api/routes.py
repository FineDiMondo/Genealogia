from __future__ import annotations

from fastapi import APIRouter

from ..agent.normalization_engine import DataNormalizationEngine
from ..rules.duplicate_detection import DuplicateDetector
from .schemas import BatchIn, PersonIn

router = APIRouter()
engine = DataNormalizationEngine()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.post("/normalize")
async def normalize(person: PersonIn) -> dict:
    out = await engine.normalize_record(person.model_dump(), source="api")
    return out.to_dict()


@router.post("/normalize/batch")
async def normalize_batch(payload: BatchIn) -> dict:
    records = [r.model_dump() for r in payload.records]
    normalized, flagged = await engine.normalize_batch(records, source=payload.source)
    return {"normalized": [p.to_dict() for p in normalized], "flagged": flagged}


@router.post("/duplicates")
async def duplicates(payload: BatchIn) -> dict:
    records = [r.model_dump() for r in payload.records]
    return {"duplicates": DuplicateDetector.detect(records)}

