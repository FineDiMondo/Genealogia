#!/usr/bin/env python3
"""
PROGRAM-ID. GENGED01
Scopo: import GEDCOM -> dataset DAT fixed-length tramite schema CPY.
RC IBM: 0000 OK | 0004 WARNING | 0008 ERROR | 0012 SEVERE
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List

from GENVAL00 import parse_copybook, rc_max, sysout

PROGRAM_ID = "GENGED01"
VERSION = "1.0.0"

BASE_DIR = Path(__file__).resolve().parents[1]
COPY_DIR = BASE_DIR / "copy"
DATA_DIR = BASE_DIR / "data"
REPO_ROOT = BASE_DIR.parents[0]


@dataclass
class GedPerson:
    gid: str
    nome: str = ""
    cognome: str = ""
    sesso: str = "U"
    nasc_data: str = "00000000"
    mort_data: str = "00000000"
    padre_id: str = ""
    madre_id: str = ""
    fams: str = ""
    famc: str = ""


@dataclass
class GedFamily:
    gid: str
    marito: str = ""
    moglie: str = ""
    matrimonio: str = "00000000"
    figli: List[str] = field(default_factory=list)


def _normalize_id(ged_id: str, prefix: str) -> str:
    raw = re.sub(r"[^0-9A-Za-z]", "", ged_id).upper()
    nums = "".join(ch for ch in raw if ch.isdigit())
    if not nums:
        nums = f"{abs(hash(raw)) % 10000000:07d}"
    return f"{prefix}{nums[:7].zfill(7)}"


def _parse_ged_date(text: str) -> str:
    if not text:
        return "00000000"
    t = text.strip().upper()
    m = re.search(r"(\d{1,2})\s+([A-Z]{3})\s+(\d{4})", t)
    if m:
        day = int(m.group(1))
        month_map = {
            "JAN": 1,
            "FEB": 2,
            "MAR": 3,
            "APR": 4,
            "MAY": 5,
            "JUN": 6,
            "JUL": 7,
            "AUG": 8,
            "SEP": 9,
            "OCT": 10,
            "NOV": 11,
            "DEC": 12,
        }
        month = month_map.get(m.group(2), 0)
        year = int(m.group(3))
        if month:
            return f"{year:04d}{month:02d}{day:02d}"
    m = re.search(r"(\d{4})", t)
    if m:
        return f"{int(m.group(1)):04d}0000"
    return "00000000"


def _scan_sources() -> List[Path]:
    g1 = sorted((REPO_ROOT / "genealogy" / "gedcom").rglob("*.ged"))
    g2 = sorted((REPO_ROOT / "data" / "import" / "raw").glob("*.ged"))
    return g1 + g2


def _is_probably_gedcom(path: Path) -> bool:
    try:
        raw = path.read_bytes()[:65536]
    except OSError:
        return False
    if b"\x00" in raw:
        return False
    text = raw.decode("utf-8", errors="ignore")
    head_ok = "0 HEAD" in text
    has_entities = (" INDI" in text) or (" FAM" in text)
    return head_ok and has_entities


def _parse_gedcom(files: List[Path]) -> tuple[Dict[str, GedPerson], Dict[str, GedFamily]]:
    persons: Dict[str, GedPerson] = {}
    families: Dict[str, GedFamily] = {}

    current_type = ""
    current_id = ""
    current_event = ""

    for path in files:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        for line in lines:
            m0 = re.match(r"0\s+@([^@]+)@\s+(INDI|FAM)", line)
            if m0:
                current_id = m0.group(1)
                current_type = m0.group(2)
                current_event = ""
                if current_type == "INDI" and current_id not in persons:
                    persons[current_id] = GedPerson(gid=current_id)
                if current_type == "FAM" and current_id not in families:
                    families[current_id] = GedFamily(gid=current_id)
                continue

            if current_type == "INDI" and current_id in persons:
                p = persons[current_id]
                if line.startswith("1 NAME "):
                    name_raw = line[7:].strip().replace("/", "")
                    parts = name_raw.split()
                    p.nome = parts[0] if parts else ""
                    p.cognome = " ".join(parts[1:]) if len(parts) > 1 else ""
                elif line.startswith("1 SEX "):
                    sx = line[6:].strip().upper()
                    p.sesso = sx if sx in {"M", "F"} else "U"
                elif line.startswith("1 BIRT"):
                    current_event = "BIRT"
                elif line.startswith("1 DEAT"):
                    current_event = "DEAT"
                elif line.startswith("2 DATE ") and current_event == "BIRT":
                    p.nasc_data = _parse_ged_date(line[7:])
                elif line.startswith("2 DATE ") and current_event == "DEAT":
                    p.mort_data = _parse_ged_date(line[7:])
                elif line.startswith("1 FAMC @"):
                    p.famc = re.sub(r"[^A-Za-z0-9]", "", line.split("@")[1])
                elif line.startswith("1 FAMS @"):
                    p.fams = re.sub(r"[^A-Za-z0-9]", "", line.split("@")[1])

            if current_type == "FAM" and current_id in families:
                f = families[current_id]
                if line.startswith("1 HUSB @"):
                    f.marito = re.sub(r"[^A-Za-z0-9]", "", line.split("@")[1])
                elif line.startswith("1 WIFE @"):
                    f.moglie = re.sub(r"[^A-Za-z0-9]", "", line.split("@")[1])
                elif line.startswith("1 CHIL @"):
                    f.figli.append(re.sub(r"[^A-Za-z0-9]", "", line.split("@")[1]))
                elif line.startswith("1 MARR"):
                    current_event = "MARR"
                elif line.startswith("2 DATE ") and current_event == "MARR":
                    f.matrimonio = _parse_ged_date(line[7:])

    for fam in families.values():
        for cid in fam.figli:
            if cid in persons:
                if fam.marito:
                    persons[cid].padre_id = fam.marito
                if fam.moglie:
                    persons[cid].madre_id = fam.moglie

    return persons, families


def _fmt_field(value: str, length: int, numeric: bool = False) -> str:
    v = "" if value is None else str(value)
    if numeric:
        v = re.sub(r"\D", "", v)
        return v[:length].rjust(length, "0")
    return v[:length].ljust(length, " ")


def _build_record(fields: List[tuple[str, int, bool]]) -> str:
    return "".join(_fmt_field(v, l, n) for v, l, n in fields)


def _write_dataset(path: Path, lrecl: int, dataset_name: str, records: List[str], version: str = "1.0.0") -> None:
    today = datetime.now().strftime("%Y%m%d")
    count = f"{len(records):08d}"
    hdr = ("H" + dataset_name.ljust(28) + today + count + version).ljust(lrecl)[:lrecl]
    trl = ("T" + dataset_name.ljust(28) + today + count).ljust(lrecl)[:lrecl]
    lines = [hdr] + records + [trl]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    sysout(f"{PROGRAM_ID} START VERSION={VERSION}")
    rc = 0

    sources = _scan_sources()
    if not sources:
        sysout("WARNING nessun GEDCOM trovato in genealogy/gedcom o data/import/raw")
        return 4

    valid_sources: List[Path] = []
    for src in sources:
        if _is_probably_gedcom(src):
            valid_sources.append(src)
            sysout(f"INPUT GEDCOM: {src}")
        else:
            sysout(f"WARNING file ignorato (non GEDCOM testuale): {src}")

    if not valid_sources:
        sysout("WARNING nessun GEDCOM valido trovato, generazione dataset vuoti")
    persons, families = _parse_gedcom(valid_sources) if valid_sources else ({}, {})

    s_ind = parse_copybook(COPY_DIR / "INDIVID.CPY")
    s_fam = parse_copybook(COPY_DIR / "FAMIGLI.CPY")
    s_tit = parse_copybook(COPY_DIR / "TITOLI.CPY")
    s_luo = parse_copybook(COPY_DIR / "LUOGHI.CPY")
    s_eve = parse_copybook(COPY_DIR / "EVENTI.CPY")
    s_fon = parse_copybook(COPY_DIR / "FONTI.CPY")

    ind_records: List[str] = []
    for idx, person in enumerate(persons.values(), start=1):
        ind_id = _normalize_id(person.gid, "I")
        padre_id = _normalize_id(person.padre_id, "I") if person.padre_id else ""
        madre_id = _normalize_id(person.madre_id, "I") if person.madre_id else ""
        fam_id = _normalize_id(person.fams, "F") if person.fams else ""
        rec = _build_record(
            [
                (ind_id, 8, False),
                (person.cognome, 30, False),
                (person.nome, 25, False),
                (person.sesso or "U", 1, False),
                (person.nasc_data, 8, True),
                ("", 8, False),
                ("E" if person.nasc_data != "00000000" else "U", 1, False),
                (person.mort_data, 8, True),
                ("", 8, False),
                ("E" if person.mort_data != "00000000" else "U", 1, False),
                (padre_id, 8, False),
                (madre_id, 8, False),
                (fam_id, 8, False),
                ("", 8, False),
                ("", 40, False),
                ("", 8, False),
                ("Y" if idx == 1 else "N", 1, False),
                ("DOC", 3, False),
                ("01" if idx == 1 else "02", 2, True),
                ("", 16, False),
            ]
        )
        ind_records.append(rec[: s_ind.lrecl].ljust(s_ind.lrecl))

    fam_records: List[str] = []
    for fam in families.values():
        fam_id = _normalize_id(fam.gid, "F")
        husb = _normalize_id(fam.marito, "I") if fam.marito else ""
        wife = _normalize_id(fam.moglie, "I") if fam.moglie else ""
        rec = _build_record(
            [
                (fam_id, 8, False),
                (husb, 8, False),
                (wife, 8, False),
                (fam.matrimonio, 8, True),
                ("", 30, False),
                ("U", 1, False),
                ("00000000", 8, True),
                ("", 30, False),
                ("", 19, False),
            ]
        )
        fam_records.append(rec[: s_fam.lrecl].ljust(s_fam.lrecl))

    _write_dataset(DATA_DIR / "GENIND00.DAT", s_ind.lrecl, "GENIND00.DAT", ind_records, s_ind.version)
    _write_dataset(DATA_DIR / "GENFAM00.DAT", s_fam.lrecl, "GENFAM00.DAT", fam_records, s_fam.version)
    _write_dataset(DATA_DIR / "GENTIT00.DAT", s_tit.lrecl, "GENTIT00.DAT", [], s_tit.version)
    _write_dataset(DATA_DIR / "GENLUO00.DAT", s_luo.lrecl, "GENLUO00.DAT", [], s_luo.version)
    _write_dataset(DATA_DIR / "GENEVE00.DAT", s_eve.lrecl, "GENEVE00.DAT", [], s_eve.version)
    _write_dataset(DATA_DIR / "GENFON00.DAT", s_fon.lrecl, "GENFON00.DAT", [], s_fon.version)

    sysout(f"IMPORT STAT: INDIVIDUI={len(ind_records)} FAMIGLIE={len(fam_records)}")
    if len(ind_records) == 0:
        rc = rc_max(rc, 4)
    sysout(f"{PROGRAM_ID} END RC={rc:04d}")
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
