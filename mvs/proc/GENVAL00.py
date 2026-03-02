#!/usr/bin/env python3
"""
PROGRAM-ID. GENVAL00
Scopo: parser COPYBOOK COBOL + validatore dataset FB.
RC IBM: 0000 OK | 0004 WARNING | 0008 ERROR | 0012 SEVERE
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

PROGRAM_ID = "GENVAL00"
VERSION = "1.0.0"

BASE_DIR = Path(__file__).resolve().parents[1]
COPY_DIR = BASE_DIR / "copy"
DATA_DIR = BASE_DIR / "data"


@dataclass
class FieldDef:
    name: str
    pic_type: str
    length: int
    offset: int


@dataclass
class Schema:
    copy_id: str
    lrecl: int
    recfm: str
    version: str
    fields: List[FieldDef]


DATASET_TO_COPY = {
    "GENIND00.DAT": "INDIVID.CPY",
    "GENFAM00.DAT": "FAMIGLI.CPY",
    "GENEVE00.DAT": "EVENTI.CPY",
    "GENLUO00.DAT": "LUOGHI.CPY",
    "GENFON00.DAT": "FONTI.CPY",
    "GENTIT00.DAT": "TITOLI.CPY",
}


def sysout(msg: str) -> None:
    print(f"// {msg}")


def rc_max(current: int, new_rc: int) -> int:
    return new_rc if new_rc > current else current


def parse_copybook(path: Path) -> Schema:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()

    copy_id = path.stem
    lrecl = 0
    recfm = "FB"
    version = "1.0.0"

    fields: List[FieldDef] = []
    offset = 1

    pic_re = re.compile(r"^\s+05\s+([A-Z0-9-]+)\s+PIC\s+([X9])\((\d+)\)\.", re.IGNORECASE)

    for line in lines:
        l = line.strip()
        if l.startswith("*"):
            m = re.search(r"COPY-ID\.\s+([A-Z0-9-]+)", l, re.IGNORECASE)
            if m:
                copy_id = m.group(1).upper()
            m = re.search(r"LRECL\.\s+(\d+)", l, re.IGNORECASE)
            if m:
                lrecl = int(m.group(1))
            m = re.search(r"RECFM\.\s+([A-Z0-9]+)", l, re.IGNORECASE)
            if m:
                recfm = m.group(1).upper()
            m = re.search(r"VERSION\.\s+([0-9.]+)", l, re.IGNORECASE)
            if m:
                version = m.group(1)
            continue

        m = pic_re.match(line)
        if not m:
            continue
        name = m.group(1).upper()
        ptype = m.group(2).upper()
        plen = int(m.group(3))
        if "FILLER" not in name:
            fields.append(FieldDef(name=name, pic_type=ptype, length=plen, offset=offset))
        offset += plen

    computed_lrecl = offset - 1
    if lrecl == 0:
        lrecl = computed_lrecl
    return Schema(copy_id=copy_id, lrecl=lrecl, recfm=recfm, version=version, fields=fields)


def parse_record(record: str, schema: Schema) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for f in schema.fields:
        start = f.offset - 1
        end = start + f.length
        out[f.name] = record[start:end]
    return out


def _parse_trailer_count(line: str) -> int | None:
    nums = re.findall(r"\d{8}", line)
    if not nums:
        return None
    return int(nums[-1])


def validate_dataset(dataset_path: Path, schema: Schema) -> Tuple[int, int]:
    if not dataset_path.exists():
        sysout(f"{dataset_path.name}: WARNING dataset non trovato")
        return 4, 0

    rc = 0
    logical_records = 0
    lines = dataset_path.read_text(encoding="utf-8", errors="replace").splitlines()
    if not lines:
        sysout(f"{dataset_path.name}: WARNING dataset vuoto")
        return 4, 0

    header = lines[0]
    if not header.startswith("H"):
        sysout(f"{dataset_path.name}: ERROR header H mancante")
        rc = rc_max(rc, 8)

    trailer_found = False
    trailer_count: int | None = None

    for idx, line in enumerate(lines, start=1):
        if len(line) != schema.lrecl:
            sysout(f"{dataset_path.name}: ERROR LRECL errato riga {idx}, trovato {len(line)} atteso {schema.lrecl}")
            rc = rc_max(rc, 8)
            continue
        if idx == 1:
            continue
        if line.startswith("T"):
            trailer_found = True
            trailer_count = _parse_trailer_count(line)
            break
        if line.startswith("H"):
            sysout(f"{dataset_path.name}: WARNING header duplicato riga {idx}")
            rc = rc_max(rc, 4)
            continue

        logical_records += 1
        parsed = parse_record(line, schema)
        for f in schema.fields:
            value = parsed[f.name]
            if f.pic_type == "9" and value.strip() and not value.isdigit():
                sysout(f"{dataset_path.name}: ERROR campo non numerico {f.name} riga {idx}")
                rc = rc_max(rc, 8)

    if not trailer_found:
        sysout(f"{dataset_path.name}: WARNING trailer T mancante")
        rc = rc_max(rc, 4)
    elif trailer_count is not None and trailer_count != logical_records:
        sysout(
            f"{dataset_path.name}: ERROR trailer count mismatch trailer={trailer_count} records={logical_records}"
        )
        rc = rc_max(rc, 8)

    return rc, logical_records


def main() -> int:
    sysout(f"{PROGRAM_ID} START VERSION={VERSION}")
    worst_rc = 0

    for dataset, copy_name in DATASET_TO_COPY.items():
        copy_path = COPY_DIR / copy_name
        if not copy_path.exists():
            sysout(f"{dataset}: WARNING copybook mancante {copy_name}")
            worst_rc = rc_max(worst_rc, 4)
            continue

        schema = parse_copybook(copy_path)
        if schema.recfm != "FB":
            sysout(f"{dataset}: WARNING RECFM non FB ({schema.recfm})")
            worst_rc = rc_max(worst_rc, 4)

        rc, count = validate_dataset(DATA_DIR / dataset, schema)
        worst_rc = rc_max(worst_rc, rc)
        sysout(f"{dataset}: RC={rc:04d} RECORDS={count}")

    sysout(f"{PROGRAM_ID} END RC={worst_rc:04d}")
    return worst_rc


if __name__ == "__main__":
    raise SystemExit(main())
