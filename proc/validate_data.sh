#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT_DIR/data"
AR_DIR="$DATA_DIR/araldica"
ASSET_DIR="$ROOT_DIR/PORTALE_GN/assets/heraldry"
OUT_DIR="$ROOT_DIR/out"
LOG_DIR="$ROOT_DIR/logs"

mkdir -p "$OUT_DIR" "$LOG_DIR"

python3 - "$DATA_DIR" "$AR_DIR" "$ASSET_DIR" "$OUT_DIR" "$LOG_DIR" <<'PY' | tee "$LOG_DIR/validate_latest.log"
import pathlib
import re
import sys

data_dir = pathlib.Path(sys.argv[1])
ar_dir = pathlib.Path(sys.argv[2])
asset_dir = pathlib.Path(sys.argv[3])
out_dir = pathlib.Path(sys.argv[4])
log_dir = pathlib.Path(sys.argv[5])

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
}

def is_date_ok(v):
    if not v:
        return True
    return bool(re.match(r"^\d{4}(-\d{2}(-\d{2})?)?$", v))

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

report = ["VALIDATION REPORT", "================="]
for name in ("PERSONE.DAT", "FAMIGLIE.DAT", "FONTI.DAT", "EVENTI.DAT", "CASATI.DAT", "RAMI.DAT", "STEMMI.DAT", "APPARTENENZE.DAT", "ALLIANZE.DAT"):
    report.append(f"FILE|{name}|RECORDS={len(rows.get(name, []))}")
report.append(f"ISSUES|COUNT={len(issues)}")
report.extend(issues)

(out_dir / "VALIDATION_REPORT.txt").write_text("\n".join(report) + "\n", encoding="utf-8")
(log_dir / "missing_heraldry_assets.log").write_text(("\n".join(missing_assets) if missing_assets else "# NONE\n") + "\n", encoding="utf-8")

print("\n".join(report[:12]))
if missing_assets:
    print(f"WARN|MISSING_HERALDRY_ASSETS={len(missing_assets)}")
if issues:
    sys.exit(1)
PY
