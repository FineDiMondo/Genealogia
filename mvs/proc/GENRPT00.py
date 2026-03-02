#!/usr/bin/env python3
"""
PROGRAM-ID. GENRPT00
Scopo: batch DAT -> JSON per frontend CICS-like.
RC IBM: 0000 OK | 0004 WARNING | 0008 ERROR | 0012 SEVERE
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

from GENVAL00 import DATASET_TO_COPY, parse_copybook, parse_record, rc_max, sysout

PROGRAM_ID = "GENRPT00"
VERSION = "1.0.0"

BASE_DIR = Path(__file__).resolve().parents[1]
COPY_DIR = BASE_DIR / "copy"
DATA_DIR = BASE_DIR / "data"
OUT_DIR = BASE_DIR / "out" / "current"


def read_dataset(dataset_name: str, copy_name: str) -> List[Dict[str, str]]:
    schema = parse_copybook(COPY_DIR / copy_name)
    path = DATA_DIR / dataset_name
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    rows: List[Dict[str, str]] = []
    for line in lines:
        if line.startswith(("H", "T")) or not line.strip():
            continue
        if len(line) < schema.lrecl:
            continue
        rec = parse_record(line, schema)
        cleaned = {k: v.rstrip() for k, v in rec.items()}
        rows.append(cleaned)
    return rows


def write_json(name: str, payload: Dict) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with (OUT_DIR / name).open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)


def step_individui() -> int:
    rows = read_dataset("GENIND00.DAT", "INDIVID.CPY")
    records = []
    for r in rows:
        records.append(
            {
                "id": r.get("IND-ID", ""),
                "nome": r.get("IND-NOME", ""),
                "cognome": r.get("IND-COGNOME", ""),
                "name": f"{r.get('IND-NOME', '').strip()} {r.get('IND-COGNOME', '').strip()}".strip(),
                "sesso": r.get("IND-SESSO", "U"),
                "gen_num": r.get("IND-GEN-NUM", "00"),
                "padre_id": r.get("IND-PADRE-ID", ""),
                "madre_id": r.get("IND-MADRE-ID", ""),
                "fam_id": r.get("IND-FAM-ID", ""),
                "titolo_id": r.get("IND-TITOLO-ID", ""),
                "nasc_data": r.get("IND-NASC-DATA", "00000000"),
                "mort_data": r.get("IND-MORT-DATA", "00000000"),
                "nasc_luogo_id": r.get("IND-NASC-LUOGO-ID", ""),
                "mort_luogo_id": r.get("IND-MORT-LUOGO-ID", ""),
                "attendib": r.get("IND-ATTENDIB", ""),
                "fonte_id": r.get("IND-FONTE-ID", ""),
                "note": r.get("IND-NOTE", ""),
            }
        )
    write_json("individui.json", {"dataset": "GENIND00", "count": len(records), "records": records})
    return 0


def step_famiglie() -> int:
    rows = read_dataset("GENFAM00.DAT", "FAMIGLI.CPY")
    records = []
    for r in rows:
        records.append(
            {
                "id": r.get("FAM-ID", ""),
                "marito_id": r.get("FAM-MARITO", ""),
                "moglie_id": r.get("FAM-MOGLIE", ""),
                "matr_data": r.get("FAM-MATR-DATA", "00000000"),
                "matr_luogo": r.get("FAM-MATR-LUOGO", ""),
                "matr_tipo": r.get("FAM-MATR-TIPO", ""),
                "separ_data": r.get("FAM-SEPAR-DATA", "00000000"),
                "note": r.get("FAM-NOTE", ""),
            }
        )
    write_json("famiglie.json", {"dataset": "GENFAM00", "count": len(records), "records": records})
    return 0


def step_titoli() -> int:
    rows = read_dataset("GENTIT00.DAT", "TITOLI.CPY")
    records = []
    for r in rows:
        records.append(
            {
                "id": r.get("TIT-ID", ""),
                "nome": r.get("TIT-NOME", ""),
                "tipo": r.get("TIT-TIPO", ""),
                "regno": r.get("TIT-REGNO", ""),
                "anno_iniz": r.get("TIT-ANNO-INIZ", "0000"),
                "anno_fine": r.get("TIT-ANNO-FINE", "0000"),
                "ind_id": r.get("TIT-IND-ID", ""),
                "fonte_id": r.get("TIT-FONTE", ""),
            }
        )
    write_json("titoli.json", {"dataset": "GENTIT00", "count": len(records), "records": records})
    return 0


def step_eventi() -> int:
    rows = read_dataset("GENEVE00.DAT", "EVENTI.CPY")
    records = []
    for r in rows:
        records.append(
            {
                "id": r.get("EVE-ID", ""),
                "tipo": r.get("EVE-TIPO", ""),
                "data": r.get("EVE-DATA", "00000000"),
                "data_tipo": r.get("EVE-DATA-TIPO", "U"),
                "luogo_id": r.get("EVE-LUOGO-ID", ""),
                "ind_id": r.get("EVE-IND-ID", ""),
                "fam_id": r.get("EVE-FAM-ID", ""),
                "descr": r.get("EVE-DESCR", ""),
                "fonte_id": r.get("EVE-FONTE-ID", ""),
                "attendib": r.get("EVE-ATTENDIB", ""),
            }
        )
    write_json("eventi.json", {"dataset": "GENEVE00", "count": len(records), "records": records})
    return 0


def step_luoghi() -> int:
    rows = read_dataset("GENLUO00.DAT", "LUOGHI.CPY")
    records = []
    for r in rows:
        records.append(
            {
                "id": r.get("LUO-ID", ""),
                "nome": r.get("LUO-NOME", ""),
                "prov": r.get("LUO-PROV", ""),
                "stato": r.get("LUO-STATO", ""),
                "lat": r.get("LUO-LAT", ""),
                "lon": r.get("LUO-LON", ""),
            }
        )
    write_json("luoghi.json", {"dataset": "GENLUO00", "count": len(records), "records": records})
    return 0


def step_fonti() -> int:
    rows = read_dataset("GENFON00.DAT", "FONTI.CPY")
    records = []
    for r in rows:
        records.append(
            {
                "id": r.get("FON-ID", ""),
                "tipo": r.get("FON-TIPO", ""),
                "titolo": r.get("FON-TITOLO", ""),
                "archivio": r.get("FON-ARCHIVIO", ""),
                "anno": r.get("FON-ANNO", "0000"),
                "note": r.get("FON-NOTE", ""),
            }
        )
    write_json("fonti.json", {"dataset": "GENFON00", "count": len(records), "records": records})
    return 0


def _build_node_map(records: List[Dict]) -> Dict[str, Dict]:
    node_map: Dict[str, Dict] = {}
    for r in records:
        rid = r.get("id", "")
        if not rid:
            continue
        node_map[rid] = {
            "id": rid,
            "nome": r.get("nome", ""),
            "cognome": r.get("cognome", ""),
            "gen_num": r.get("gen_num", "00"),
            "padre_id": r.get("padre_id", ""),
            "madre_id": r.get("madre_id", ""),
            "children": [],
        }
    return node_map


def _link_children(node_map: Dict[str, Dict]) -> None:
    for node in list(node_map.values()):
        for parent_key in ("padre_id", "madre_id"):
            pid = node.get(parent_key, "")
            if pid and pid in node_map:
                node_map[pid]["children"].append(node)


def _find_root(records: List[Dict], node_map: Dict[str, Dict]) -> str | None:
    capostipiti = [r for r in records if r.get("id") and r.get("gen_num", "").strip() == "01"]
    if capostipiti:
        return capostipiti[0]["id"]
    without_parents = [r for r in records if r.get("id") and not r.get("padre_id") and not r.get("madre_id")]
    if without_parents:
        return without_parents[0]["id"]
    return next(iter(node_map.keys()), None)


def step_albero() -> int:
    path = OUT_DIR / "individui.json"
    if not path.exists():
        write_json("albero.json", {})
        return 4
    payload = json.loads(path.read_text(encoding="utf-8"))
    records = payload.get("records", [])
    node_map = _build_node_map(records)
    _link_children(node_map)
    root_id = _find_root(records, node_map)
    root = node_map.get(root_id, {}) if root_id else {}
    write_json("albero.json", root)
    return 0 if root else 4


def main() -> int:
    sysout(f"{PROGRAM_ID} START VERSION={VERSION}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rc = 0
    rc = rc_max(rc, step_individui())
    rc = rc_max(rc, step_famiglie())
    rc = rc_max(rc, step_titoli())
    rc = rc_max(rc, step_eventi())
    rc = rc_max(rc, step_luoghi())
    rc = rc_max(rc, step_fonti())
    rc = rc_max(rc, step_albero())
    write_json(
        "_build.json",
        {
            "program": PROGRAM_ID,
            "version": VERSION,
            "return_code": f"{rc:04d}",
            "datasets": list(DATASET_TO_COPY.keys()),
        },
    )
    sysout(f"{PROGRAM_ID} END RC={rc:04d}")
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
