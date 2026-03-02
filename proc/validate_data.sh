#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT_DIR/data"
AR_DIR="$DATA_DIR/araldica"
NOB_DIR="$DATA_DIR/nobilta"
ASSET_DIR="$ROOT_DIR/PORTALE_GN/assets/heraldry"
OUT_DIR="$ROOT_DIR/out"
LOG_DIR="$ROOT_DIR/logs"

mkdir -p "$OUT_DIR" "$LOG_DIR"

python3 - "$DATA_DIR" "$AR_DIR" "$NOB_DIR" "$ASSET_DIR" "$OUT_DIR" "$LOG_DIR" <<'PY' | tee "$LOG_DIR/validate_latest.log"
import pathlib
import re
import sys
import datetime

data_dir = pathlib.Path(sys.argv[1])
ar_dir = pathlib.Path(sys.argv[2])
nob_dir = pathlib.Path(sys.argv[3])
asset_dir = pathlib.Path(sys.argv[4])
out_dir = pathlib.Path(sys.argv[5])
log_dir = pathlib.Path(sys.argv[6])

spec = {
    data_dir / "PERSONE.DAT": (13, r"^P\d{6}$"),
    data_dir / "FAMIGLIE.DAT": (10, r"^F\d{6}$"),
    data_dir / "FONTI.DAT": (8, r"^S\d{6}$"),
    data_dir / "EVENTI.DAT": (8, r"^E\d{6}$"),
    ar_dir / "CASATI.DAT": (7, r"^C\d{6}$"),
    ar_dir / "RAMI.DAT": (6, r"^R\d{6}$"),
    ar_dir / "STEMMI.DAT": (11, r"^H\d{6}$"),
    ar_dir / "APPARTENENZE.DAT": (8, r"^A\d{6}$"),
    ar_dir / "ALLIANZE.DAT": (7, r"^L\d{6}$"),
    nob_dir / "TITOLI.DAT": (6, r"^T\d{6}$"),
    nob_dir / "CASATI_TITOLI.DAT": (7, r"^CT\d{6}$"),
    nob_dir / "PERSONE_TITOLI.DAT": (8, r"^PT\d{6}$"),
    nob_dir / "MATRIMONI_TITOLI.DAT": (8, r"^MT\d{6}$"),
}

def is_date_ok(v):
    if not v:
        return True
    return bool(re.match(r"^\d{4}(-\d{2}(-\d{2})?)?$", v))

def parse_date(v):
    if not v:
        return None
    if re.match(r"^\d{4}$", v):
        return datetime.date(int(v), 1, 1)
    if re.match(r"^\d{4}-\d{2}$", v):
        y, m = v.split("-")
        return datetime.date(int(y), int(m), 1)
    if re.match(r"^\d{4}-\d{2}-\d{2}$", v):
        y, m, d = v.split("-")
        return datetime.date(int(y), int(m), int(d))
    return None

def ranges_overlap(dal1, al1, dal2, al2):
    s1 = parse_date(dal1) or datetime.date(1, 1, 1)
    e1 = parse_date(al1) or datetime.date(9999, 12, 31)
    s2 = parse_date(dal2) or datetime.date(1, 1, 1)
    e2 = parse_date(al2) or datetime.date(9999, 12, 31)
    return not (e1 < s2 or e2 < s1)

def read_rows(path, expected):
    rows = []
    errs = []
    if not path.exists():
        errs.append(f"ERROR|{path.name}|MISSING_FILE")
        return rows, errs
    for ln, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        cols = line.split("|")
        if len(cols) != expected:
            errs.append(f"ERROR|{path.name}|LINE_{ln}|FIELD_COUNT|EXPECTED={expected}|FOUND={len(cols)}")
            continue
        rows.append((ln, cols))
    return rows, errs

rows = {}
issues = []
ids = {}

for p, (cnt, id_re) in spec.items():
    rr, ee = read_rows(p, cnt)
    rows[p.name] = rr
    issues.extend(ee)
    seen = set()
    ids[p.name] = set()
    for ln, c in rr:
        rid = c[0]
        if not re.match(id_re, rid):
            issues.append(f"ERROR|{p.name}|LINE_{ln}|BAD_ID|{rid}")
        if rid in seen:
            issues.append(f"ERROR|{p.name}|LINE_{ln}|DUPLICATE_ID|{rid}")
        seen.add(rid)
        ids[p.name].add(rid)

person_ids = ids.get("PERSONE.DAT", set())
family_ids = ids.get("FAMIGLIE.DAT", set())
source_ids = ids.get("FONTI.DAT", set())
casati_ids = ids.get("CASATI.DAT", set())
rami_ids = ids.get("RAMI.DAT", set())
title_ids = ids.get("TITOLI.DAT", set())
ct_ids = ids.get("CASATI_TITOLI.DAT", set())
pt_ids = ids.get("PERSONE_TITOLI.DAT", set())
mt_ids = ids.get("MATRIMONI_TITOLI.DAT", set())

for ln, c in rows.get("PERSONE.DAT", []):
    for idx in (5, 7):
        if not is_date_ok(c[idx]):
            issues.append(f"ERROR|PERSONE.DAT|LINE_{ln}|BAD_DATE|COL={idx+1}|VAL={c[idx]}")
    for ref in (c[9], c[10]):
        if ref and ref not in family_ids:
            issues.append(f"ERROR|PERSONE.DAT|LINE_{ln}|MISSING_FAMILY_REF|{ref}")
    if c[11]:
        for sid in [x.strip() for x in c[11].split(",") if x.strip()]:
            if sid not in source_ids:
                issues.append(f"ERROR|PERSONE.DAT|LINE_{ln}|MISSING_SOURCE_REF|{sid}")

for ln, c in rows.get("FAMIGLIE.DAT", []):
    for ref in (c[3], c[4]):
        if ref and ref not in person_ids:
            issues.append(f"ERROR|FAMIGLIE.DAT|LINE_{ln}|MISSING_PERSON_REF|{ref}")
    if c[5]:
        for pid in [x.strip() for x in c[5].split(",") if x.strip()]:
            if pid not in person_ids:
                issues.append(f"ERROR|FAMIGLIE.DAT|LINE_{ln}|MISSING_CHILD_REF|{pid}")
    if not is_date_ok(c[6]):
        issues.append(f"ERROR|FAMIGLIE.DAT|LINE_{ln}|BAD_DATE|COL=7|VAL={c[6]}")
    if c[8]:
        for sid in [x.strip() for x in c[8].split(",") if x.strip()]:
            if sid not in source_ids:
                issues.append(f"ERROR|FAMIGLIE.DAT|LINE_{ln}|MISSING_SOURCE_REF|{sid}")

for ln, c in rows.get("FONTI.DAT", []):
    if not is_date_ok(c[3]):
        issues.append(f"ERROR|FONTI.DAT|LINE_{ln}|BAD_DATE|COL=4|VAL={c[3]}")

for ln, c in rows.get("EVENTI.DAT", []):
    if not is_date_ok(c[2]):
        issues.append(f"ERROR|EVENTI.DAT|LINE_{ln}|BAD_DATE|COL=3|VAL={c[2]}")
    if c[4] and c[4] not in person_ids:
        issues.append(f"ERROR|EVENTI.DAT|LINE_{ln}|MISSING_PERSON_REF|{c[4]}")
    if c[5] and c[5] not in family_ids:
        issues.append(f"ERROR|EVENTI.DAT|LINE_{ln}|MISSING_FAMILY_REF|{c[5]}")
    if c[6] and c[6] not in source_ids:
        issues.append(f"ERROR|EVENTI.DAT|LINE_{ln}|MISSING_SOURCE_REF|{c[6]}")

for ln, c in rows.get("CASATI.DAT", []):
    if not is_date_ok(c[3]) or not is_date_ok(c[4]):
        issues.append(f"ERROR|CASATI.DAT|LINE_{ln}|BAD_DATE_RANGE")
    if c[6] and c[6] not in source_ids:
        issues.append(f"ERROR|CASATI.DAT|LINE_{ln}|MISSING_SOURCE_REF|{c[6]}")

for ln, c in rows.get("RAMI.DAT", []):
    if c[1] and c[1] not in casati_ids:
        issues.append(f"ERROR|RAMI.DAT|LINE_{ln}|MISSING_CASATO_REF|{c[1]}")
    if not is_date_ok(c[3]) or not is_date_ok(c[4]):
        issues.append(f"ERROR|RAMI.DAT|LINE_{ln}|BAD_DATE_RANGE")

missing_assets = []
for ln, c in rows.get("STEMMI.DAT", []):
    if c[1] and c[1] not in casati_ids:
        issues.append(f"ERROR|STEMMI.DAT|LINE_{ln}|MISSING_CASATO_REF|{c[1]}")
    if c[2] and c[2] not in rami_ids:
        issues.append(f"ERROR|STEMMI.DAT|LINE_{ln}|MISSING_RAMO_REF|{c[2]}")
    if not is_date_ok(c[6]) or not is_date_ok(c[7]):
        issues.append(f"ERROR|STEMMI.DAT|LINE_{ln}|BAD_DATE_RANGE")
    if not re.match(r"^\d+$", c[8]):
        issues.append(f"ERROR|STEMMI.DAT|LINE_{ln}|BAD_PRIORITY|{c[8]}")
    if c[9] and c[9] not in source_ids:
        issues.append(f"ERROR|STEMMI.DAT|LINE_{ln}|MISSING_SOURCE_REF|{c[9]}")
    if c[5]:
        rel = pathlib.Path(c[5]).as_posix()
        if rel.startswith("assets/heraldry/"):
            ap = asset_dir / pathlib.Path(rel).name
            if not ap.exists():
                missing_assets.append(f"MISSING_ASSET|{c[0]}|{c[5]}")

for ln, c in rows.get("APPARTENENZE.DAT", []):
    if c[1] and c[1] not in person_ids:
        issues.append(f"ERROR|APPARTENENZE.DAT|LINE_{ln}|MISSING_PERSON_REF|{c[1]}")
    if c[2] and c[2] not in casati_ids:
        issues.append(f"ERROR|APPARTENENZE.DAT|LINE_{ln}|MISSING_CASATO_REF|{c[2]}")
    if c[3] and c[3] not in rami_ids:
        issues.append(f"ERROR|APPARTENENZE.DAT|LINE_{ln}|MISSING_RAMO_REF|{c[3]}")
    if not is_date_ok(c[5]) or not is_date_ok(c[6]):
        issues.append(f"ERROR|APPARTENENZE.DAT|LINE_{ln}|BAD_DATE_RANGE")

for ln, c in rows.get("ALLIANZE.DAT", []):
    if c[1] and c[1] not in casati_ids:
        issues.append(f"ERROR|ALLIANZE.DAT|LINE_{ln}|MISSING_CASATO_REF|{c[1]}")
    if c[2] and c[2] not in casati_ids:
        issues.append(f"ERROR|ALLIANZE.DAT|LINE_{ln}|MISSING_CASATO_REF|{c[2]}")
    if not is_date_ok(c[3]) or not is_date_ok(c[4]):
        issues.append(f"ERROR|ALLIANZE.DAT|LINE_{ln}|BAD_DATE_RANGE")
    if c[6] and c[6] not in source_ids:
        issues.append(f"ERROR|ALLIANZE.DAT|LINE_{ln}|MISSING_SOURCE_REF|{c[6]}")

title_name_seen = {}
for ln, c in rows.get("TITOLI.DAT", []):
    name_key = c[2].strip().upper()
    if name_key in title_name_seen:
        issues.append(f"ERROR|TITOLI.DAT|LINE_{ln}|DUPLICATE_DENOMINAZIONE|{c[2]}")
    else:
        title_name_seen[name_key] = c[0]

for ln, c in rows.get("CASATI_TITOLI.DAT", []):
    if c[1] and c[1] not in casati_ids:
        issues.append(f"ERROR|CASATI_TITOLI.DAT|LINE_{ln}|MISSING_CASATO_REF|{c[1]}")
    if c[2] and c[2] not in title_ids:
        issues.append(f"ERROR|CASATI_TITOLI.DAT|LINE_{ln}|MISSING_TITOLO_REF|{c[2]}")
    if c[5] not in {"EREDITARIO", "CONCESSIONE", "USO_STORICO"}:
        issues.append(f"ERROR|CASATI_TITOLI.DAT|LINE_{ln}|BAD_MODALITA|{c[5]}")
    if not is_date_ok(c[3]) or not is_date_ok(c[4]):
        issues.append(f"ERROR|CASATI_TITOLI.DAT|LINE_{ln}|BAD_DATE_RANGE")

apps_by_person = {}
for _, a in rows.get("APPARTENENZE.DAT", []):
    apps_by_person.setdefault(a[1], []).append(a)

ct_by_title_casato = {}
for _, ct in rows.get("CASATI_TITOLI.DAT", []):
    ct_by_title_casato.setdefault((ct[2], ct[1]), []).append(ct)

title_conflicts = []
for ln, c in rows.get("PERSONE_TITOLI.DAT", []):
    if c[1] and c[1] not in person_ids:
        issues.append(f"ERROR|PERSONE_TITOLI.DAT|LINE_{ln}|MISSING_PERSON_REF|{c[1]}")
    if c[2] and c[2] not in title_ids:
        issues.append(f"ERROR|PERSONE_TITOLI.DAT|LINE_{ln}|MISSING_TITOLO_REF|{c[2]}")
    if c[6] and c[6] not in source_ids:
        issues.append(f"ERROR|PERSONE_TITOLI.DAT|LINE_{ln}|MISSING_SOURCE_REF|{c[6]}")
    if c[5] not in {"NASCITA", "SUCCESSIONE", "MATRIMONIO", "CONCESSIONE", "ASSUNZIONE", "USO_ONORIFICO"}:
        issues.append(f"ERROR|PERSONE_TITOLI.DAT|LINE_{ln}|BAD_MODALITA_ACQUISIZIONE|{c[5]}")
    if not is_date_ok(c[3]) or not is_date_ok(c[4]):
        issues.append(f"ERROR|PERSONE_TITOLI.DAT|LINE_{ln}|BAD_DATE_RANGE")

    # Check person title within casato/title historical ranges when casato membership exists.
    person_apps = apps_by_person.get(c[1], [])
    if person_apps:
        matched = False
        for app in person_apps:
            casato = app[2]
            for ct in ct_by_title_casato.get((c[2], casato), []):
                if ranges_overlap(c[3], c[4], ct[3], ct[4]):
                    matched = True
                    break
            if matched:
                break
        if not matched:
            title_conflicts.append(f"TITLE_RANGE_CONFLICT|PERSON={c[1]}|TITOLO={c[2]}|LINE={ln}")
            issues.append(f"ERROR|PERSONE_TITOLI.DAT|LINE_{ln}|TITLE_OUTSIDE_CASATO_RANGE|{c[2]}")

family_by_id = {r[0]: r for _, r in rows.get("FAMIGLIE.DAT", [])}
marriage_conflicts = []
for ln, c in rows.get("MATRIMONI_TITOLI.DAT", []):
    if c[1] and c[1] not in family_ids:
        issues.append(f"ERROR|MATRIMONI_TITOLI.DAT|LINE_{ln}|MISSING_FAMIGLIA_REF|{c[1]}")
    if c[2] and c[2] not in person_ids:
        issues.append(f"ERROR|MATRIMONI_TITOLI.DAT|LINE_{ln}|MISSING_CONIUGE1_REF|{c[2]}")
    if c[3] and c[3] not in person_ids:
        issues.append(f"ERROR|MATRIMONI_TITOLI.DAT|LINE_{ln}|MISSING_CONIUGE2_REF|{c[3]}")
    if c[6] and c[6] not in title_ids:
        issues.append(f"ERROR|MATRIMONI_TITOLI.DAT|LINE_{ln}|MISSING_TITOLO_REF|{c[6]}")
    if c[5] not in {"ACQUISIZIONE_TITOLO", "CONSORTE_DI", "TRASMISSIONE_AI_FIGLI", "NESSUN_EFFETTO"}:
        issues.append(f"ERROR|MATRIMONI_TITOLI.DAT|LINE_{ln}|BAD_EFFETTO|{c[5]}")
    if not is_date_ok(c[4]):
        issues.append(f"ERROR|MATRIMONI_TITOLI.DAT|LINE_{ln}|BAD_DATE|COL=5|VAL={c[4]}")

    fam = family_by_id.get(c[1])
    if fam:
        spouses = {fam[3], fam[4]}
        if c[2] not in spouses or c[3] not in spouses:
            marriage_conflicts.append(f"MARRIAGE_PERSON_MISMATCH|LINE={ln}|FAM={c[1]}|C1={c[2]}|C2={c[3]}")
            issues.append(f"ERROR|MATRIMONI_TITOLI.DAT|LINE_{ln}|CONIUGI_NOT_IN_FAMILY|{c[1]}")

report = ["VALIDATION REPORT", "================="]
for name in ("PERSONE.DAT", "FAMIGLIE.DAT", "FONTI.DAT", "EVENTI.DAT", "CASATI.DAT", "RAMI.DAT", "STEMMI.DAT", "APPARTENENZE.DAT", "ALLIANZE.DAT", "TITOLI.DAT", "CASATI_TITOLI.DAT", "PERSONE_TITOLI.DAT", "MATRIMONI_TITOLI.DAT"):
    report.append(f"FILE|{name}|RECORDS={len(rows.get(name, []))}")
report.append(f"ISSUES|COUNT={len(issues)}")
report.extend(issues)

(out_dir / "VALIDATION_REPORT.txt").write_text("\n".join(report) + "\n", encoding="utf-8")
(log_dir / "missing_heraldry_assets.log").write_text(("\n".join(missing_assets) if missing_assets else "# NONE\n") + "\n", encoding="utf-8")
(log_dir / "titles_conflicts.log").write_text(("\n".join(title_conflicts) if title_conflicts else "# NONE\n") + "\n", encoding="utf-8")
(log_dir / "marriage_title_inconsistencies.log").write_text(("\n".join(marriage_conflicts) if marriage_conflicts else "# NONE\n") + "\n", encoding="utf-8")

print("\n".join(report[:12]))
if missing_assets:
    print(f"WARN|MISSING_HERALDRY_ASSETS={len(missing_assets)}")
if issues:
    sys.exit(1)
PY
