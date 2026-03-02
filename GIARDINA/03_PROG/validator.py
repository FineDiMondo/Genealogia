from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from common import (
    CURATED_DIR,
    GENERATED_SCHEMA_DIR,
    RC_ERROR,
    RC_OK,
    RC_WARNING,
    RELIABILITY_SET,
    REPORTS_DIR,
    JobResult,
    ensure_layout,
    load_records,
    read_yaml,
    write_text,
)
from copy_compiler import compile_all

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
ID_RE = re.compile(r"^\d{4}-\d{2}-\d{2}__[A-Z]+__[a-z0-9-]+__[a-z0-9-]+__[a-z0-9-]+$")


def _get_value(data: dict[str, Any], field: str) -> Any:
    if "." not in field:
        return data.get(field)
    curr: Any = data
    for part in field.split("."):
        if not isinstance(curr, dict):
            return None
        curr = curr.get(part)
    return curr


def _validate_type(value: Any, typ: str) -> bool:
    if typ == "string":
        return isinstance(value, str)
    if typ == "integer":
        return isinstance(value, int)
    if typ == "array":
        return isinstance(value, list)
    return True


def _schema_for_type(record_type: str) -> Path:
    return GENERATED_SCHEMA_DIR / f"{record_type}.schema.json"


def _load_media_catalog() -> dict[str, dict[str, Any]]:
    catalog_path = CURATED_DIR / "MEDIA_CATALOG.yml"
    if not catalog_path.exists():
        return {}
    payload = read_yaml(catalog_path) or []
    if not isinstance(payload, list):
        return {}
    out: dict[str, dict[str, Any]] = {}
    for item in payload:
        if not isinstance(item, dict):
            continue
        med_id = str(item.get("med_id", "")).strip()
        if med_id:
            out[med_id] = item
    return out


def validate_records() -> JobResult:
    ensure_layout()
    compile_all()

    errors: list[str] = []
    warnings: list[str] = []
    records = load_records()

    ids_seen: set[str] = set()
    records_by_id: dict[str, dict[str, Any]] = {}

    for record in records:
        rid = str(record.get("id", "")).strip()
        rtype = str(record.get("type", "")).strip()
        if not rid:
            errors.append(f"E2001|{record.get('_path','?')}|MISSING_ID")
            continue
        if rid in ids_seen:
            errors.append(f"E2004|{record.get('_path','?')}|DUPLICATE_ID|{rid}")
        ids_seen.add(rid)
        records_by_id[rid] = record

        if not ID_RE.match(rid):
            errors.append(f"E2001|{record.get('_path','?')}|INVALID_ID_FORMAT|{rid}")
        if not DATE_RE.match(str(_get_value(record, "date.sort") or "")):
            errors.append(f"E2005|{record.get('_path','?')}|INVALID_DATE_SORT")
        if str(record.get("reliability", "")).strip() not in RELIABILITY_SET:
            errors.append(f"E2001|{record.get('_path','?')}|INVALID_RELIABILITY")

        if rtype:
            schema_path = _schema_for_type(rtype)
            if not schema_path.exists():
                errors.append(f"E1002|{record.get('_path','?')}|SCHEMA_MISSING|{rtype}")
            else:
                schema = json.loads(schema_path.read_text(encoding="utf-8"))
                for req in schema.get("required", []):
                    if _get_value(record, req) in (None, ""):
                        errors.append(f"E2001|{record.get('_path','?')}|MISSING_REQUIRED|{req}")
                for key, spec in schema.get("properties", {}).items():
                    value = _get_value(record, key)
                    if value is None:
                        continue
                    typ = str(spec.get("type", ""))
                    if not _validate_type(value, typ):
                        errors.append(f"E2001|{record.get('_path','?')}|TYPE_MISMATCH|{key}")
                    pattern = spec.get("pattern")
                    if pattern and isinstance(value, str):
                        if not re.match(str(pattern), value):
                            errors.append(f"E2001|{record.get('_path','?')}|PATTERN_MISMATCH|{key}")
                    enums = spec.get("enum")
                    if enums and value not in enums:
                        errors.append(f"E2001|{record.get('_path','?')}|ENUM_MISMATCH|{key}")

    media_catalog = _load_media_catalog()
    ref_fields = ["source_ids", "family_ids", "person_ids", "arms_ids", "place_id"]
    for record in records:
        rid = str(record.get("id", "")).strip()
        for field in ref_fields:
            value = record.get(field)
            if value is None:
                continue
            ids = value if isinstance(value, list) else [value]
            for item in ids:
                if item and item not in records_by_id:
                    errors.append(f"E2002|{record.get('_path','?')}|MISSING_LINK|{field}|{item}")

        media_ids = record.get("media_ids", [])
        if isinstance(media_ids, list):
            for med_id in media_ids:
                if med_id not in media_catalog:
                    errors.append(f"E2003|{record.get('_path','?')}|MISSING_MEDIA_CATALOG|{med_id}")
                    continue
                file_name = str(media_catalog[med_id].get("file_name", "")).strip()
                if file_name and not (CURATED_DIR / file_name).exists():
                    errors.append(f"E2003|{record.get('_path','?')}|MISSING_MEDIA_FILE|{file_name}")

        sources = record.get("source_ids", [])
        if record.get("reliability") == "DOCUMENTATO" and not sources:
            warnings.append(f"W3001|{record.get('_path','?')}|DOCUMENTED_WITHOUT_SOURCE")
        if record.get("reliability") == "ATTRIBUITO" and not sources:
            warnings.append(f"W3002|{record.get('_path','?')}|ATTRIBUTED_WITHOUT_SOURCE")

    rc = RC_OK
    if errors:
        rc = RC_ERROR
    elif warnings:
        rc = RC_WARNING

    summary = [
        "JOB|VALIDATE",
        f"RECORDS|{len(records)}",
        f"ERRORS|{len(errors)}",
        f"WARNINGS|{len(warnings)}",
        f"RETURN-CODE|{rc}",
    ]
    write_text(REPORTS_DIR / "validate_report.log", summary + errors + warnings)
    return JobResult(rc=rc, errors=errors, warnings=warnings)
