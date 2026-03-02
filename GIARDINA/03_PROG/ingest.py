from __future__ import annotations

import hashlib
import mimetypes
import re
import shutil
from datetime import date
from pathlib import Path

from common import CURATED_DIR, RAW_DIR, RC_ERROR, RC_OK, REPORTS_DIR, JobResult, read_yaml, write_text, write_yaml

ID_RE = re.compile(r"^\d{4}-\d{2}-\d{2}__[A-Z]+__[a-z0-9-]+__[a-z0-9-]+__[a-z0-9-]+$")


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def ingest(record_id: str, with_hash: bool = False) -> JobResult:
    errors: list[str] = []
    warnings: list[str] = []
    messages: list[str] = ["JOB|INGEST", f"RECORD-ID|{record_id}"]

    if not ID_RE.match(record_id):
        errors.append(f"E2001|INVALID_RECORD_ID|{record_id}")
        write_text(REPORTS_DIR / "ingest_report.log", messages + errors)
        return JobResult(rc=RC_ERROR, errors=errors, warnings=warnings)

    raw_files = sorted([p for p in RAW_DIR.iterdir() if p.is_file()])
    if not raw_files:
        errors.append("E2003|RAW_EMPTY|NO_FILES")
        write_text(REPORTS_DIR / "ingest_report.log", messages + errors)
        return JobResult(rc=RC_ERROR, errors=errors, warnings=warnings)

    catalog_path = CURATED_DIR / "MEDIA_CATALOG.yml"
    catalog = read_yaml(catalog_path) if catalog_path.exists() else []
    if not isinstance(catalog, list):
        catalog = []

    for idx, source in enumerate(raw_files, start=1):
        ext = source.suffix.lower().lstrip(".")
        dest_name = f"{record_id}__scan{idx:03d}.{ext}"
        dest = CURATED_DIR / dest_name
        shutil.move(str(source), str(dest))
        sha = _sha256(dest)
        mime, _ = mimetypes.guess_type(dest.name)
        catalog.append(
            {
                "med_id": dest.stem,
                "file_name": dest.name,
                "ext": ext,
                "mime": mime or "application/octet-stream",
                "sha256": sha,
                "size_bytes": dest.stat().st_size,
                "source_path": str(RAW_DIR),
                "curated_path": str(dest),
                "credit": "",
                "copyright": "",
                "created_at": date.today().isoformat(),
            }
        )
        messages.append(f"OK|MOVED|{source.name}|{dest.name}")

    write_yaml(catalog_path, catalog)
    write_text(REPORTS_DIR / "ingest_report.log", messages)
    return JobResult(rc=RC_OK, errors=errors, warnings=warnings)
