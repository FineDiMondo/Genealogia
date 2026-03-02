from __future__ import annotations

import asyncio
import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Callable
from uuid import uuid4

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from ..agent.normalization_engine import DataNormalizationEngine


def _job_id() -> str:
    return f"JOB-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid4().hex[:6].upper()}"


class GiardinaIntegration:
    """
    Handle GIARDINA batch pipeline integration.
    """

    def __init__(self, config: dict | None = None) -> None:
        cfg = config or {}
        self.input_dir = Path(cfg.get("input_dir", "data/incoming"))
        self.output_dir = Path(cfg.get("output_dir", "data/normalized"))
        self.audit_dir = Path(cfg.get("audit_dir", "data/normalized"))
        self.status_dir = Path(cfg.get("status_dir", "data/normalized"))
        self.input_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.audit_dir.mkdir(parents=True, exist_ok=True)
        self.status_dir.mkdir(parents=True, exist_ok=True)
        self.engine = DataNormalizationEngine(auto_approve_threshold=float(cfg.get("auto_approve_threshold", 0.85)))

    def process_incoming_gedcom(self, filename: str) -> dict:
        src_path = self.input_dir / filename
        if not src_path.exists():
            raise FileNotFoundError(f"GEDCOM file not found: {src_path}")

        records = self.read_gedcom(str(src_path))
        normalized, flagged = asyncio.run(self.engine.normalize_batch(records, source="giardina"))

        stem = src_path.stem
        output_file = self.output_dir / f"{stem}.ged"
        audit_file = self.audit_dir / f"{stem}_audit.json"
        status_file = self.status_dir / f"{stem}_status.json"
        job_id = _job_id()

        self.write_normalized_gedcom([n.to_dict() for n in normalized], str(output_file))
        audit_data = {
            "job_id": job_id,
            "source_file": src_path.name,
            "processing_timestamp": datetime.now().isoformat(),
            "total_records": len(records),
            "records_auto_approved": sum(1 for n in normalized if not n.flagged_for_review),
            "records_flagged": len(flagged),
            "changes": [
                {
                    "person_id": n.person_id,
                    "changes": [asdict(c) for c in n.changes],
                    "confidence": n.confidence,
                    "auto_approved": not n.flagged_for_review,
                }
                for n in normalized
            ],
            "flagged_records": flagged,
        }
        self.write_audit_trail(audit_data, str(audit_file))

        status_data = {
            "job_id": job_id,
            "source_file": src_path.name,
            "output_file": output_file.name,
            "audit_file": audit_file.name,
            "status": "COMPLETE",
            "total_records": len(records),
            "auto_approved": audit_data["records_auto_approved"],
            "flagged": audit_data["records_flagged"],
            "updated_at": datetime.now().isoformat(),
        }
        self.write_status_report(status_data, str(status_file))
        return status_data

    def read_gedcom(self, filepath: str) -> list[dict]:
        records: list[dict] = []
        current: dict | None = None
        mode = None
        for raw in Path(filepath).read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw.strip()
            if not line:
                continue
            if line.startswith("0 @") and " INDI" in line:
                if current:
                    records.append(current)
                token = line.split("@")[1]
                current = {
                    "person_id": token,
                    "given_names": "",
                    "family_name": "",
                    "birth_date": None,
                    "birth_place": None,
                    "death_date": None,
                    "death_place": None,
                    "parents": [],
                    "spouse": [],
                    "children": [],
                }
                mode = None
                continue
            if current is None:
                continue
            if line.startswith("1 NAME "):
                val = line[7:].strip()
                if "/" in val:
                    parts = val.split("/")
                    current["given_names"] = parts[0].strip()
                    current["family_name"] = parts[1].strip() if len(parts) > 1 else ""
                else:
                    current["given_names"] = val
                continue
            if line.startswith("1 BIRT"):
                mode = "BIRT"
                continue
            if line.startswith("1 DEAT"):
                mode = "DEAT"
                continue
            if line.startswith("2 DATE "):
                date_val = line[7:].strip()
                if mode == "BIRT":
                    current["birth_date"] = date_val
                elif mode == "DEAT":
                    current["death_date"] = date_val
                continue
            if line.startswith("2 PLAC "):
                place_val = line[7:].strip()
                if mode == "BIRT":
                    current["birth_place"] = place_val
                elif mode == "DEAT":
                    current["death_place"] = place_val
                continue
        if current:
            records.append(current)
        return records

    def write_normalized_gedcom(self, records: list[dict], output_path: str) -> None:
        lines = ["0 HEAD", "1 SOUR GENEALOGY-NORMALIZATION-AGENT", "1 GEDC", "2 VERS 5.5.1", "1 CHAR UTF-8"]
        for r in records:
            pid = str(r.get("person_id", "UNKNOWN"))
            gn = str(r.get("given_names", "")).strip()
            fn = str(r.get("family_name", "")).strip()
            bdate = str(r.get("birth_date") or "").strip()
            bplace = str(r.get("birth_place") or "").strip()
            ddate = str(r.get("death_date") or "").strip()
            dplace = str(r.get("death_place") or "").strip()
            lines.append(f"0 @{pid}@ INDI")
            lines.append(f"1 NAME {gn} /{fn}/")
            if bdate or bplace:
                lines.append("1 BIRT")
                if bdate:
                    lines.append(f"2 DATE {bdate}")
                if bplace:
                    lines.append(f"2 PLAC {bplace}")
            if ddate or dplace:
                lines.append("1 DEAT")
                if ddate:
                    lines.append(f"2 DATE {ddate}")
                if dplace:
                    lines.append(f"2 PLAC {dplace}")
        lines.append("0 TRLR")
        Path(output_path).write_text("\n".join(lines) + "\n", encoding="utf-8")

    def write_audit_trail(self, audit_data: dict, audit_path: str) -> None:
        Path(audit_path).write_text(json.dumps(audit_data, ensure_ascii=False, indent=2), encoding="utf-8")

    def write_status_report(self, status_data: dict, status_path: str) -> None:
        Path(status_path).write_text(json.dumps(status_data, ensure_ascii=False, indent=2), encoding="utf-8")

    def monitor_incoming(self, callback: Callable[[dict], None] | None = None) -> Observer:
        integration = self

        class _GedcomHandler(FileSystemEventHandler):
            def on_created(self, event):  # noqa: N802
                if event.is_directory:
                    return
                p = Path(event.src_path)
                if p.suffix.lower() != ".ged":
                    return
                status = integration.process_incoming_gedcom(p.name)
                if callback:
                    callback(status)

        observer = Observer()
        observer.schedule(_GedcomHandler(), str(self.input_dir), recursive=False)
        observer.start()
        return observer

