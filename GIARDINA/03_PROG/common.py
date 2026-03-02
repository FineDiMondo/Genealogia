from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT / "00_DOCS"
COPY_DIR = ROOT / "01_COPY"
DATA_DIR = ROOT / "02_DATA"
RAW_DIR = DATA_DIR / "RAW"
CURATED_DIR = DATA_DIR / "CURATED"
RECORDS_DIR = DATA_DIR / "RECORDS"
PROG_DIR = ROOT / "03_PROG"
JCL_DIR = ROOT / "04_JCL"
OUT_DIR = ROOT / "05_OUT"
SITE_DIR = OUT_DIR / "site"
INDEX_DIR = OUT_DIR / "index"
REPORTS_DIR = OUT_DIR / "reports"
TEST_DIR = ROOT / "06_TEST"

COPY_RECORDS_DIR = COPY_DIR / "COPY-RECORDS"
COPY_MEDIA_DIR = COPY_DIR / "COPY-MEDIA"
COPY_INDEX_DIR = COPY_DIR / "COPY-INDEX"
COPY_CODES_DIR = COPY_DIR / "COPY-CODES"
GENERATED_SCHEMA_DIR = OUT_DIR / "index" / "schemas"

RC_OK = 0
RC_WARNING = 4
RC_ERROR = 8

RELIABILITY_SET = {"DOCUMENTATO", "STAMPA", "ATTRIBUITO", "RICOSTRUITO"}
TYPE_FOLDERS = {
    "EVENT": "EVENT",
    "PERSON": "PERSON",
    "FAMILY": "FAMILY",
    "SOURCE": "SOURCE",
    "ARMS": "ARMS",
    "PLACE": "PLACE",
}


@dataclass(frozen=True)
class JobResult:
    rc: int
    errors: list[str]
    warnings: list[str]


def ensure_layout() -> None:
    for path in [OUT_DIR, SITE_DIR, INDEX_DIR, REPORTS_DIR, GENERATED_SCHEMA_DIR]:
        path.mkdir(parents=True, exist_ok=True)


def read_yaml(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def write_yaml(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(payload, handle, sort_keys=False, allow_unicode=True)


def write_json(path: Path, payload: Any) -> None:
    import json

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, lines: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def collect_record_files() -> list[Path]:
    files: list[Path] = []
    for folder in TYPE_FOLDERS.values():
        files.extend(sorted((RECORDS_DIR / folder).glob("*.yml")))
    return files


def load_records() -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for path in collect_record_files():
        payload = read_yaml(path) or {}
        if not isinstance(payload, dict):
            continue
        payload["_path"] = str(path.relative_to(ROOT))
        records.append(payload)
    return records

