from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from ..agent.normalization_engine import DataNormalizationEngine
from ..dashboard.service import DashboardService
from ..integrations.gestionale_integration import GestionaleIntegration
from ..integrations.giardina_integration import GiardinaIntegration
from ..rules.duplicate_detection import DuplicateDetector
from .schemas import BatchIn, DashboardHistoryIn, PersonIn

router = APIRouter()
engine = DataNormalizationEngine()
giardina = GiardinaIntegration()
gestionale = GestionaleIntegration()
dashboard = DashboardService()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.post("/normalize")
async def normalize(person: PersonIn) -> dict:
    out = await engine.normalize_record(person.model_dump(), source="api")
    dashboard.record_normalization_batch([out], source_system="api", domain="individuals")
    return out.to_dict()


@router.post("/normalize/batch")
async def normalize_batch(payload: BatchIn) -> dict:
    records = [r.model_dump() for r in payload.records]
    normalized, flagged = await engine.normalize_batch(records, source=payload.source)
    dashboard.record_normalization_batch(normalized, source_system=payload.source, domain="individuals")
    return {"normalized": [p.to_dict() for p in normalized], "flagged": flagged}


@router.post("/duplicates")
async def duplicates(payload: BatchIn) -> dict:
    records = [r.model_dump() for r in payload.records]
    return {"duplicates": DuplicateDetector.detect(records)}


@router.post("/integrations/giardina/process")
async def process_gedcom(filename: str) -> dict:
    return giardina.process_incoming_gedcom(filename)


@router.post("/integrations/gestionale/export")
async def export_gestionale(payload: BatchIn, job_id: str | None = None) -> dict:
    records = [await engine.normalize_record(r.model_dump(), source=payload.source) for r in payload.records]
    auto_approved = [p for p in records if not p.flagged_for_review]
    flagged = [p for p in records if p.flagged_for_review]
    resolved_job_id = job_id or f"JOB-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    gestionale.export_to_gestionale(resolved_job_id, records, auto_approved, flagged)
    return {
        "job_id": resolved_job_id,
        "total_records": len(records),
        "auto_approved_count": len(auto_approved),
        "flagged_count": len(flagged),
        "pending_file": f"{resolved_job_id}.json",
    }


@router.get("/api/v1/dashboard/metrics")
async def dashboard_metrics() -> dict:
    return dashboard.get_metrics_payload()


@router.get("/api/v1/dashboard/sources")
async def dashboard_sources() -> dict:
    return dashboard.get_sources_payload()


@router.get("/api/v1/dashboard/timeline")
async def dashboard_timeline() -> dict:
    return dashboard.get_timeline_payload()


@router.get("/api/v1/dashboard/reuse")
async def dashboard_reuse() -> dict:
    return dashboard.get_reuse_payload()


@router.get("/api/v1/dashboard/quality")
async def dashboard_quality() -> dict:
    return dashboard.get_quality_payload()


@router.post("/api/v1/dashboard/history")
async def dashboard_history(payload: DashboardHistoryIn) -> dict:
    return dashboard.export_history(
        start_date=payload.start_date,
        end_date=payload.end_date,
        export_format=payload.export_format,
    )
