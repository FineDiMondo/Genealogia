from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from common import COPY_MEDIA_DIR, COPY_RECORDS_DIR, GENERATED_SCHEMA_DIR, ensure_layout, write_json

FIELD_RE = re.compile(
    r"^05\s+FIELD\s+([A-Z0-9-]+)\s+(REQUIRED|OPTIONAL)\s+TYPE=([A-Z]+)(?:\s+(.+))?\.$"
)
KV_RE = re.compile(r"([A-Z]+)=([^ ]+)")
RECORD_RE = re.compile(r'^05\s+RECORD-NAME\s+VALUE\s+"([A-Z]+)"\.$')

FIELD_MAP = {
    "ID": "id",
    "TYPE": "type",
    "TITLE": "title",
    "NAME": "name",
    "SLUG": "slug",
    "STATUS": "status",
    "FAMILY-ID": "family_id",
    "BLAZON": "blazon",
    "DATE-SORT": "date.sort",
    "DATE-DISPLAY": "date.display",
    "PLACE-ID": "place_id",
    "RELIABILITY": "reliability",
    "SOURCE-IDS": "source_ids",
    "FAMILY-IDS": "family_ids",
    "PERSON-IDS": "person_ids",
    "ARMS-IDS": "arms_ids",
    "MEDIA-IDS": "media_ids",
    "TAGS": "tags",
    "NOTES": "notes",
    "BIRTH-DATE": "birth_date",
    "DEATH-DATE": "death_date",
    "REGION": "region",
    "COUNTRY": "country",
}


def _normalize_field_name(raw: str) -> str:
    trimmed = raw
    for prefix in ["EVT-", "PRS-", "FAM-", "SRC-", "ARM-", "PLC-", "MED-", "IDX-"]:
        if raw.startswith(prefix):
            trimmed = raw[len(prefix) :]
            break
    return FIELD_MAP.get(trimmed, trimmed.lower().replace("-", "_"))


def _split_kv(extra: str) -> dict[str, str]:
    if not extra:
        return {}
    out: dict[str, str] = {}
    for key, value in KV_RE.findall(extra):
        out[key] = value
    return out


def parse_copy(path: Path) -> dict[str, Any]:
    lines = path.read_text(encoding="utf-8").splitlines()
    record_name = ""
    properties: dict[str, Any] = {}
    required: list[str] = []

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("*"):
            continue
        m_record = RECORD_RE.match(line)
        if m_record:
            record_name = m_record.group(1)
            continue
        m_field = FIELD_RE.match(line)
        if not m_field:
            continue
        field_name, req_opt, ftype, extra = m_field.groups()
        output_name = _normalize_field_name(field_name)
        kv = _split_kv(extra or "")

        schema_prop: dict[str, Any] = {}
        if ftype == "STRING":
            schema_prop["type"] = "string"
        elif ftype == "INTEGER":
            schema_prop["type"] = "integer"
        elif ftype == "LIST":
            schema_prop["type"] = "array"
            schema_prop["items"] = {"type": "string"}
        else:
            schema_prop["type"] = "string"

        if "MAX" in kv and schema_prop.get("type") == "string":
            schema_prop["maxLength"] = int(kv["MAX"])
        if "PATTERN" in kv:
            schema_prop["pattern"] = kv["PATTERN"]
        if "ENUM" in kv:
            schema_prop["enum"] = kv["ENUM"].split(",")

        properties[output_name] = schema_prop
        if req_opt == "REQUIRED":
            required.append(output_name)

    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": record_name or path.stem,
        "type": "object",
        "properties": properties,
        "required": sorted(set(required)),
        "additionalProperties": True,
    }
    return schema


def compile_all() -> list[Path]:
    ensure_layout()
    generated: list[Path] = []
    copy_files = sorted(COPY_RECORDS_DIR.glob("*.CPY")) + sorted(COPY_MEDIA_DIR.glob("*.CPY"))
    for copy_file in copy_files:
        schema = parse_copy(copy_file)
        out_path = GENERATED_SCHEMA_DIR / f"{copy_file.stem}.schema.json"
        write_json(out_path, schema)
        generated.append(out_path)
    return generated
