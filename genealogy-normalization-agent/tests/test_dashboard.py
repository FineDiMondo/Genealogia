from __future__ import annotations

from datetime import date
from pathlib import Path

from src.agent.data_models import NormalizedPerson
from src.dashboard.service import DashboardService


def _person(pid: str, confidence: float = 0.92, flagged: bool = False) -> NormalizedPerson:
    return NormalizedPerson(
        person_id=pid,
        given_names="Pietro",
        family_name="Giardina",
        birth_date="1500-03-15",
        birth_place="Palermo, Sicilia, Italia",
        confidence=confidence,
        flagged_for_review=flagged,
        conflict_reasons=["manual review"] if flagged else [],
    )


def test_dashboard_metrics_and_quality(tmp_path: Path) -> None:
    service = DashboardService(
        db_path=str(tmp_path / "metrics.sqlite3"),
        targets_path=str(tmp_path / "targets.json"),
    )
    service.record_normalization_batch(
        [_person("P000001", 0.95, False), _person("P000002", 0.72, True)],
        source_system="test",
        domain="individuals",
    )

    metrics = service.get_metrics_payload()
    assert "overall" in metrics
    assert metrics["overall"]["normalized_records"] >= 2
    assert "individuals" in metrics["domains"]

    quality = service.get_quality_payload()
    assert "avg_confidence" in quality
    assert quality["avg_confidence"] > 0


def test_dashboard_history_export(tmp_path: Path) -> None:
    service = DashboardService(
        db_path=str(tmp_path / "metrics.sqlite3"),
        targets_path=str(tmp_path / "targets.json"),
    )
    service.record_normalization_batch([_person("P000003")], source_system="test", domain="individuals")
    today = date.today().isoformat()
    exported = service.export_history(start_date=today, end_date=today, export_format="json")
    assert exported["export_format"] == "json"
    assert "path" in exported
