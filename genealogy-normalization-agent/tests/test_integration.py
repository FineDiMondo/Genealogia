from __future__ import annotations

import json
import asyncio
import tempfile
from pathlib import Path

from src.agent.conflict_resolver import ConflictResolver
from src.agent.data_models import NormalizedPerson
from src.agent.normalization_engine import DataNormalizationEngine
from src.daemon.monitor import DaemonMonitor
from src.integrations.gestionale_integration import GestionaleIntegration
from src.integrations.giardina_integration import GiardinaIntegration


GED_SAMPLE = """0 HEAD
1 SOUR TEST
1 GEDC
2 VERS 5.5.1
1 CHAR UTF-8
0 @I1@ INDI
1 NAME PIETRO /D'AGOSTINO/
1 BIRT
2 DATE 15 MAR 1500
2 PLAC Palermo
0 TRLR
"""


def _tmp_dirs() -> tuple[Path, Path, Path, Path]:
    base = Path(tempfile.mkdtemp(prefix="gna-it-"))
    incoming = base / "incoming"
    normalized = base / "normalized"
    pending = base / "gestionale" / "pending"
    responses = base / "gestionale" / "responses"
    for d in [incoming, normalized, pending, responses]:
        d.mkdir(parents=True, exist_ok=True)
    return incoming, normalized, pending, responses


def test_giardina_workflow() -> None:
    incoming, normalized, _, _ = _tmp_dirs()
    file_path = incoming / "test.ged"
    file_path.write_text(GED_SAMPLE, encoding="utf-8")
    gi = GiardinaIntegration({"input_dir": str(incoming), "output_dir": str(normalized), "audit_dir": str(normalized), "status_dir": str(normalized)})
    status = gi.process_incoming_gedcom("test.ged")
    assert status["status"] == "COMPLETE"
    assert (normalized / "test.ged").exists()
    assert (normalized / "test_audit.json").exists()
    assert (normalized / "test_status.json").exists()


def test_gestionale_export() -> None:
    _, _, pending, responses = _tmp_dirs()
    gi = GestionaleIntegration({"pending_dir": str(pending), "response_dir": str(responses), "archive_dir": str(pending.parent / "archive")})
    engine = DataNormalizationEngine()
    person = asyncio.run(
        engine.normalize_record({"person_id": "P1", "given_names": "PIETRO", "family_name": "d'agostino"}, source="test")
    )
    job_id = gi.export_to_gestionale("JOB-001", [person], [person], [])
    out = pending / f"{job_id}.json"
    assert out.exists()
    payload = json.loads(out.read_text(encoding="utf-8"))
    assert payload["job_id"] == "JOB-001"


def test_gestionale_approval_workflow() -> None:
    _, _, pending, responses = _tmp_dirs()
    archive = pending.parent / "archive"
    gi = GestionaleIntegration({"pending_dir": str(pending), "response_dir": str(responses), "archive_dir": str(archive)})
    engine = DataNormalizationEngine()
    person = asyncio.run(
        engine.normalize_record({"person_id": "P2", "given_names": "MARIA", "family_name": "rossi"}, source="test")
    )
    gi.export_to_gestionale("JOB-002", [person], [person], [])
    (responses / "JOB-002.json").write_text(
        json.dumps({"job_id": "JOB-002", "approvals": [{"person_id": "P2", "status": "APPROVED"}]}, ensure_ascii=False),
        encoding="utf-8",
    )
    data = gi.read_responses("JOB-002")
    final = gi.apply_user_decisions("JOB-002", [person], data)
    assert len(final) == 1
    assert final[0].flagged_for_review is False
    gi.archive_processed_job("JOB-002")
    assert (archive / "pending_JOB-002.json").exists()
    assert (archive / "responses_JOB-002.json").exists()


def test_conflict_resolution() -> None:
    person = NormalizedPerson(
        person_id="P3",
        given_names="A",
        family_name="B",
        confidence=0.6,
        flagged_for_review=True,
        conflict_reasons=["self relationship conflict"],
    )
    category = ConflictResolver.categorize_conflict(person)
    assert category["severity"] in {"HIGH", "CRITICAL"}
    rec = ConflictResolver.generate_review_recommendations(person)
    assert "suggested_action" in rec


def test_daemon_parallel_operations_smoke() -> None:
    incoming, normalized, pending, responses = _tmp_dirs()
    monitor = DaemonMonitor(
        {
            "giardina": {"input_dir": str(incoming), "output_dir": str(normalized), "audit_dir": str(normalized), "status_dir": str(normalized)},
            "gestionale": {"pending_dir": str(pending), "response_dir": str(responses), "archive_dir": str(pending.parent / "archive")},
            "job_state_file": str(pending.parent / "job_state.json"),
        }
    )
    # Smoke assertions for directories and state file path.
    assert monitor.giardina.input_dir.exists()
    assert monitor.gestionale.pending_dir.exists()
    assert monitor.job_state_file.parent.exists()
