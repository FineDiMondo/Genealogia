from __future__ import annotations

import argparse
import asyncio
import json
import threading
import time
from dataclasses import asdict
from datetime import datetime
from pathlib import Path

from ..agent.data_models import NormalizationChange
from ..agent.data_models import NormalizedPerson
from ..agent.data_models import SourceAttribution
from ..integrations.gestionale_integration import GestionaleIntegration
from ..integrations.giardina_integration import GiardinaIntegration


class DaemonMonitor:
    """
    Dual monitor:
    1) /data/incoming/*.ged -> normalize + audit + pending batch
    2) /data/gestionale/responses/*.json -> apply decisions + finalize output
    """

    def __init__(self, config: dict | None = None) -> None:
        cfg = config or {}
        self.giardina = GiardinaIntegration(cfg.get("giardina", {}))
        self.gestionale = GestionaleIntegration(cfg.get("gestionale", {}))
        self.job_state_file = Path(cfg.get("job_state_file", "data/gestionale/job_state.json"))
        self.job_state_file.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()
        self.running = True

    @staticmethod
    def _person_to_state(person: NormalizedPerson) -> dict:
        return {
            "person_id": person.person_id,
            "given_names": person.given_names,
            "family_name": person.family_name,
            "name_variants": list(person.name_variants),
            "birth_date": person.birth_date,
            "birth_place": person.birth_place,
            "death_date": person.death_date,
            "death_place": person.death_place,
            "parents": list(person.parents),
            "spouse": list(person.spouse),
            "children": list(person.children),
            "sources": [asdict(s) for s in person.sources],
            "changes": [asdict(c) for c in person.changes],
            "confidence": person.confidence,
            "flagged_for_review": person.flagged_for_review,
            "conflict_reasons": list(person.conflict_reasons),
            "audit_id": person.audit_id,
            "processed_at": person.processed_at,
        }

    @staticmethod
    def _person_from_state(payload: dict) -> NormalizedPerson:
        sources = [SourceAttribution(**s) for s in payload.get("sources", [])]
        changes = [NormalizationChange(**c) for c in payload.get("changes", [])]
        return NormalizedPerson(
            person_id=str(payload.get("person_id", "")),
            given_names=str(payload.get("given_names", "")),
            family_name=str(payload.get("family_name", "")),
            name_variants=list(payload.get("name_variants", [])),
            birth_date=payload.get("birth_date"),
            birth_place=payload.get("birth_place"),
            death_date=payload.get("death_date"),
            death_place=payload.get("death_place"),
            parents=list(payload.get("parents", [])),
            spouse=list(payload.get("spouse", [])),
            children=list(payload.get("children", [])),
            sources=sources,
            changes=changes,
            confidence=float(payload.get("confidence", 0.0)),
            flagged_for_review=bool(payload.get("flagged_for_review", False)),
            conflict_reasons=list(payload.get("conflict_reasons", [])),
            audit_id=str(payload.get("audit_id", "")),
            processed_at=str(payload.get("processed_at", "")),
        )

    def _load_job_state(self) -> dict:
        if not self.job_state_file.exists():
            return {}
        try:
            return json.loads(self.job_state_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}

    def _save_job_state(self, state: dict) -> None:
        self.job_state_file.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

    def _register_job(self, job_id: str, status_payload: dict) -> None:
        with self.lock:
            state = self._load_job_state()
            state[job_id] = status_payload
            self._save_job_state(state)

    def _process_new_gedcom(self, filepath: Path) -> None:
        status = self.giardina.process_incoming_gedcom(filepath.name)
        source_records = self.giardina.read_gedcom(str(filepath))
        normalized, _flagged = asyncio.run(self.giardina.engine.normalize_batch(source_records, source="giardina-daemon"))

        auto_approved = [p for p in normalized if not p.flagged_for_review]
        flagged = [p for p in normalized if p.flagged_for_review]
        self.gestionale.export_to_gestionale(status["job_id"], normalized, auto_approved, flagged)

        status["source_path"] = str(filepath)
        status["normalized_records"] = [self._person_to_state(p) for p in normalized]
        self._register_job(status["job_id"], status)

    def _process_response(self, filepath: Path) -> None:
        job_id = filepath.stem
        responses = self.gestionale.read_responses(job_id)
        with self.lock:
            state = self._load_job_state()
            job = state.get(job_id)
            if not job:
                return
            persons = [self._person_from_state(p) for p in job.get("normalized_records", [])]
            final_people = self.gestionale.apply_user_decisions(job_id, persons, responses)

            out_path = self.giardina.output_dir / Path(str(job.get("source_file", f"{job_id}.ged"))).name
            self.giardina.write_normalized_gedcom([p.to_dict() for p in final_people], str(out_path))
            final_status = {
                "job_id": job_id,
                "source_file": job.get("source_file"),
                "output_file": out_path.name,
                "status": "FINALIZED",
                "total_records": len(persons),
                "final_records": len(final_people),
                "response_received_at": datetime.now().isoformat(),
                "response_summary": {"approvals": len(responses.get("approvals", []))},
            }
            self.giardina.write_status_report(
                final_status,
                str(self.giardina.status_dir / f"{Path(str(job.get('source_file', job_id))).stem}_status.json"),
            )
            job.update(final_status)
            state[job_id] = job
            self._save_job_state(state)
        self.gestionale.archive_processed_job(job_id)

    def _poll_loop(self, directory: Path, suffix: str, callback, interval_sec: float) -> None:
        seen: set[str] = set()
        while self.running:
            for f in sorted(directory.glob(f"*{suffix}")):
                if f.name in seen:
                    continue
                try:
                    callback(f)
                    seen.add(f.name)
                except Exception:
                    # Retry on next poll for transient errors.
                    pass
            time.sleep(interval_sec)

    def run_dual_monitor(self, interval_sec: float = 2.0) -> None:
        t1 = threading.Thread(
            target=self._poll_loop,
            args=(self.giardina.input_dir, ".ged", self._process_new_gedcom, interval_sec),
            daemon=True,
        )
        t2 = threading.Thread(
            target=self._poll_loop,
            args=(self.gestionale.response_dir, ".json", self._process_response, interval_sec),
            daemon=True,
        )
        t1.start()
        t2.start()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.running = False
            t1.join(timeout=2)
            t2.join(timeout=2)


def main() -> None:
    parser = argparse.ArgumentParser(description="Dual monitor for GIARDINA input and Gestionale responses.")
    parser.add_argument("--incoming", default="data/incoming")
    parser.add_argument("--normalized", default="data/normalized")
    parser.add_argument("--gest-pending", default="data/gestionale/pending")
    parser.add_argument("--gest-responses", default="data/gestionale/responses")
    parser.add_argument("--gest-archive", default="data/gestionale/archive")
    parser.add_argument("--interval", default=2.0, type=float)
    args = parser.parse_args()

    cfg = {
        "giardina": {
            "input_dir": args.incoming,
            "output_dir": args.normalized,
            "audit_dir": args.normalized,
            "status_dir": args.normalized,
        },
        "gestionale": {
            "pending_dir": args.gest_pending,
            "response_dir": args.gest_responses,
            "archive_dir": args.gest_archive,
        },
    }
    DaemonMonitor(cfg).run_dual_monitor(interval_sec=args.interval)


if __name__ == "__main__":
    main()
