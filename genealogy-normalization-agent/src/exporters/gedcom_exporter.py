from __future__ import annotations

from pathlib import Path


def export_minimal_gedcom(records: list[dict], output_file: str) -> Path:
    lines = ["0 HEAD", "1 SOUR GENEALOGY-NORMALIZATION-AGENT", "1 GEDC", "2 VERS 5.5.1", "1 CHAR UTF-8"]
    for idx, rec in enumerate(records, start=1):
        person_id = str(rec.get("person_id") or f"P{idx:06d}")
        given = str(rec.get("given_names") or "").strip()
        family = str(rec.get("family_name") or "").strip()
        birth_date = str(rec.get("birth_date") or "").strip()
        lines.append(f"0 @{person_id}@ INDI")
        if given or family:
            lines.append(f"1 NAME {given} /{family}/")
        if birth_date:
            lines.append("1 BIRT")
            lines.append(f"2 DATE {birth_date}")
    lines.append("0 TRLR")
    path = Path(output_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path

