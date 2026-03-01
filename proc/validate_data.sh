#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT_DIR/data"
LOG_DIR="$ROOT_DIR/logs"
OUT_DIR="$ROOT_DIR/out"

mkdir -p "$LOG_DIR" "$OUT_DIR"

REPORT_FILE="$OUT_DIR/VALIDATION_REPORT.txt"
LOG_FILE="$LOG_DIR/validate_latest.log"

python3 - "$DATA_DIR" "$REPORT_FILE" <<'PY' | tee "$LOG_FILE"
import datetime
import pathlib
import re
import sys

data_dir = pathlib.Path(sys.argv[1])
report_file = pathlib.Path(sys.argv[2])

spec = {
    "PERSONE.DAT": {"fields": 12, "id_re": r"^P\d{6}$", "id_col": 0},
    "FAMIGLIE.DAT": {"fields": 7, "id_re": r"^F\d{6}$", "id_col": 0},
    "FONTI.DAT": {"fields": 8, "id_re": r"^S\d{6}$", "id_col": 0},
    "EVENTI.DAT": {"fields": 8, "id_re": r"^E\d{6}$", "id_col": 0},
}

def parse_file(path, expected_fields):
    rows = []
    issues = []
    if not path.exists():
        issues.append(f"ERROR|{path.name}|MISSING_FILE")
        return rows, issues
    for i, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        cols = line.split("|")
        if len(cols) != expected_fields:
            issues.append(f"ERROR|{path.name}|LINE_{i}|BAD_FIELD_COUNT|EXPECTED={expected_fields}|FOUND={len(cols)}")
            continue
        rows.append((i, cols))
    return rows, issues

def valid_date(v):
    if v == "":
        return True
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
        return False
    try:
        datetime.date.fromisoformat(v)
    except ValueError:
        return False
    return True

issues = []
rows = {}
ids = {}

for fn, s in spec.items():
    r, isf = parse_file(data_dir / fn, s["fields"])
    rows[fn] = r
    issues.extend(isf)
    seen = set()
    ids[fn] = set()
    for ln, cols in r:
        rid = cols[s["id_col"]]
        if not re.match(s["id_re"], rid):
            issues.append(f"ERROR|{fn}|LINE_{ln}|BAD_ID_FORMAT|VALUE={rid}")
        if rid in seen:
            issues.append(f"ERROR|{fn}|LINE_{ln}|DUPLICATE_ID|VALUE={rid}")
        seen.add(rid)
        ids[fn].add(rid)

fam_ids = ids.get("FAMIGLIE.DAT", set())
src_ids = ids.get("FONTI.DAT", set())
per_ids = ids.get("PERSONE.DAT", set())

# PERSONE checks
for ln, c in rows.get("PERSONE.DAT", []):
    if c[3] not in {"M", "F", "U"}:
        issues.append(f"ERROR|PERSONE.DAT|LINE_{ln}|BAD_SESSO|VALUE={c[3]}")
    for idx in (4, 6):
        if not valid_date(c[idx]):
            issues.append(f"ERROR|PERSONE.DAT|LINE_{ln}|BAD_DATE|COL={idx+1}|VALUE={c[idx]}")
    if c[8] and c[8] not in fam_ids:
        issues.append(f"ERROR|PERSONE.DAT|LINE_{ln}|MISSING_FAMILY_REF|VALUE={c[8]}")
    if c[9]:
        for sid in [x.strip() for x in c[9].split(",") if x.strip()]:
            if sid not in src_ids:
                issues.append(f"ERROR|PERSONE.DAT|LINE_{ln}|MISSING_SOURCE_REF|VALUE={sid}")

# FAMIGLIE checks
for ln, c in rows.get("FAMIGLIE.DAT", []):
    if c[5]:
        for sid in [x.strip() for x in c[5].split(",") if x.strip()]:
            if sid not in src_ids:
                issues.append(f"ERROR|FAMIGLIE.DAT|LINE_{ln}|MISSING_SOURCE_REF|VALUE={sid}")

# FONTI checks
for ln, c in rows.get("FONTI.DAT", []):
    if not valid_date(c[3]):
        issues.append(f"ERROR|FONTI.DAT|LINE_{ln}|BAD_DATE|COL=4|VALUE={c[3]}")

# EVENTI checks
for ln, c in rows.get("EVENTI.DAT", []):
    if not valid_date(c[2]):
        issues.append(f"ERROR|EVENTI.DAT|LINE_{ln}|BAD_DATE|COL=3|VALUE={c[2]}")
    if not c[4] and not c[5]:
        issues.append(f"ERROR|EVENTI.DAT|LINE_{ln}|MISSING_OWNER_REF|EXPECT_PERSON_OR_FAMILY")
    if c[4] and c[4] not in per_ids:
        issues.append(f"ERROR|EVENTI.DAT|LINE_{ln}|MISSING_PERSON_REF|VALUE={c[4]}")
    if c[5] and c[5] not in fam_ids:
        issues.append(f"ERROR|EVENTI.DAT|LINE_{ln}|MISSING_FAMILY_REF|VALUE={c[5]}")
    if c[6] and c[6] not in src_ids:
        issues.append(f"ERROR|EVENTI.DAT|LINE_{ln}|MISSING_SOURCE_REF|VALUE={c[6]}")

summary = []
summary.append("VALIDATION REPORT")
summary.append("=================")
for fn in spec:
    summary.append(f"FILE|{fn}|RECORDS={len(rows.get(fn, []))}")
summary.append(f"ISSUES|COUNT={len(issues)}")

print("\n".join(summary))
for i in issues:
    print(i)

report_lines = summary + issues
report_file.write_text("\n".join(report_lines) + "\n", encoding="utf-8")

if issues:
    sys.exit(1)
PY
