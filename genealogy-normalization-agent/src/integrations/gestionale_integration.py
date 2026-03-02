from __future__ import annotations

import json
import shutil
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Callable

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from ..agent.conflict_resolver import ConflictResolver
from ..agent.data_models import NormalizedPerson


class GestionaleIntegration:
    """
    Handle file-based exchange with gestionale.
    """

    def __init__(self, config: dict | None = None) -> None:
        cfg = config or {}
        self.pending_dir = Path(cfg.get("pending_dir", "data/gestionale/pending"))
        self.response_dir = Path(cfg.get("response_dir", "data/gestionale/responses"))
        self.archive_dir = Path(cfg.get("archive_dir", "data/gestionale/archive"))
        self.pending_dir.mkdir(parents=True, exist_ok=True)
        self.response_dir.mkdir(parents=True, exist_ok=True)
        self.archive_dir.mkdir(parents=True, exist_ok=True)

    def export_to_gestionale(
        self,
        job_id: str,
        normalized_persons: list[NormalizedPerson],
        auto_approved: list[NormalizedPerson],
        flagged: list[NormalizedPerson],
    ) -> str:
        payload = {
            "job_id": job_id,
            "timestamp": datetime.now().isoformat(),
            "total_records": len(normalized_persons),
            "auto_approved_count": len(auto_approved),
            "flagged_count": len(flagged),
            "records": [
                {
                    "person_id": p.person_id,
                    "given_names": p.given_names,
                    "family_name": p.family_name,
                    "confidence": p.confidence,
                    "auto_approved": p.confidence >= 0.85 and not p.flagged_for_review,
                    "changes": [asdict(c) for c in p.changes],
                    "flagged_for_review": p.flagged_for_review,
                    "conflict_reasons": p.conflict_reasons,
                    "recommendation": ConflictResolver.generate_review_recommendations(p),
                }
                for p in normalized_persons
            ],
        }
        out_file = self.pending_dir / f"{job_id}.json"
        out_file.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return job_id

    def monitor_responses(self, callback: Callable[[str, dict], None] | None = None) -> Observer:
        integration = self

        class _ResponseHandler(FileSystemEventHandler):
            def on_created(self, event):  # noqa: N802
                if event.is_directory:
                    return
                p = Path(event.src_path)
                if p.suffix.lower() != ".json":
                    return
                job_id = p.stem
                responses = integration.read_responses(job_id)
                if callback:
                    callback(job_id, responses)

        observer = Observer()
        observer.schedule(_ResponseHandler(), str(self.response_dir), recursive=False)
        observer.start()
        return observer

    def read_responses(self, job_id: str) -> dict:
        path = self.response_dir / f"{job_id}.json"
        if not path.exists():
            raise FileNotFoundError(f"Response file not found: {path}")
        data = json.loads(path.read_text(encoding="utf-8"))
        if "approvals" not in data:
            raise ValueError("Invalid response payload: 'approvals' missing")
        return data

    def apply_user_decisions(self, job_id: str, normalized_persons: list[NormalizedPerson], responses: dict) -> list[NormalizedPerson]:
        approvals = {a.get("person_id"): a for a in responses.get("approvals", []) if a.get("person_id")}
        final: list[NormalizedPerson] = []
        for p in normalized_persons:
            decision = approvals.get(p.person_id, {})
            status = str(decision.get("status", "APPROVED")).upper()
            if status not in {"APPROVED", "REJECTED", "MODIFIED"}:
                status = "APPROVED"
            if status == "REJECTED":
                continue
            if status == "MODIFIED":
                # Minimal deterministic modification surface for file-based workflow.
                note = str(decision.get("note", "")).strip()
                if note and note.startswith("family_name="):
                    p.family_name = note.split("=", 1)[1].strip()
                p.flagged_for_review = False
                p.conflict_reasons = []
            if status == "APPROVED":
                p.flagged_for_review = False
            final.append(p)
        return final

    def archive_processed_job(self, job_id: str) -> None:
        for folder in [self.pending_dir, self.response_dir]:
            src = folder / f"{job_id}.json"
            if src.exists():
                dst = self.archive_dir / f"{folder.name}_{src.name}"
                if dst.exists():
                    dst.unlink()
                shutil.move(str(src), str(dst))
