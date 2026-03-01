#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT_DIR/data"
IMPORT_DIR="$DATA_DIR/import"
RAW_GED="$IMPORT_DIR/raw/latest.ged"
LOG_DIR="$ROOT_DIR/logs"

mkdir -p "$IMPORT_DIR/raw" "$LOG_DIR" "$DATA_DIR/araldica"

if [[ ! -f "$RAW_GED" ]]; then
  echo "ERRORE: GEDCOM non trovato: $RAW_GED"
  exit 1
fi

python3 - "$ROOT_DIR" "$RAW_GED" <<'PY' | tee "$LOG_DIR/import_latest.log"
import re
import pathlib
import datetime
import sys

root = pathlib.Path(sys.argv[1])
ged_path = pathlib.Path(sys.argv[2])
data_dir = root / "data"
import_dir = data_dir / "import"
log_dir = root / "logs"
log_dir.mkdir(parents=True, exist_ok=True)

people_file = data_dir / "PERSONE.DAT"
families_file = data_dir / "FAMIGLIE.DAT"
sources_file = data_dir / "FONTI.DAT"
events_file = data_dir / "EVENTI.DAT"
map_file = import_dir / "GEDMAP.DAT"
dupe_file = log_dir / "duplicates.log"

MONTHS = {
    "JAN": "01", "FEB": "02", "MAR": "03", "APR": "04", "MAY": "05", "JUN": "06",
    "JUL": "07", "AUG": "08", "SEP": "09", "OCT": "10", "NOV": "11", "DEC": "12"
}

def clean_name(v):
    v = v.replace("/", " ").strip()
    v = re.sub(r"\s+", " ", v)
    return v

def split_name(name):
    cleaned = clean_name(name)
    parts = cleaned.split(" ")
    if len(parts) == 1:
        return "", parts[0]
    return parts[-1].upper(), " ".join(parts[:-1]).title()

def clean_place(v):
    v = (v or "").strip()
    v = re.sub(r"\s+", " ", v)
    return v

def norm_date(raw):
    if not raw:
        return ""
    t = raw.strip().upper()
    t = re.sub(r"\b(ABT|BEF|AFT|CAL|EST|FROM|TO)\b", "", t)
    if "BET" in t and "AND" in t:
        t = t.split("AND")[0].replace("BET", "").strip()
    t = re.sub(r"\s+", " ", t).strip()
    m = re.match(r"^(\d{1,2}) ([A-Z]{3}) (\d{4})$", t)
    if m and m.group(2) in MONTHS:
        return f"{m.group(3)}-{MONTHS[m.group(2)]}-{int(m.group(1)):02d}"
    m = re.match(r"^([A-Z]{3}) (\d{4})$", t)
    if m and m.group(1) in MONTHS:
        return f"{m.group(2)}-{MONTHS[m.group(1)]}"
    m = re.match(r"^(\d{4})$", t)
    if m:
        return m.group(1)
    return ""

def parse_ged(path):
    individuals = {}
    families = {}
    current = None
    current_id = None
    current_sub = None
    for raw in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw.rstrip("\n\r")
        m = re.match(r"^(\d+)\s+(@[^@]+@)?\s*([A-Z0-9_]+)?\s*(.*)$", line)
        if not m:
            continue
        lvl = int(m.group(1))
        xref = m.group(2)
        tag = (m.group(3) or "").strip()
        value = (m.group(4) or "").strip()
        if lvl == 0:
            current_sub = None
            if xref and tag == "INDI":
                current = "INDI"
                current_id = xref.strip("@")
                individuals[current_id] = {
                    "ged_id": current_id, "name": "", "sex": "", "birth_date": "", "birth_place": "",
                    "death_date": "", "death_place": "", "famc": "", "fams": []
                }
            elif xref and tag == "FAM":
                current = "FAM"
                current_id = xref.strip("@")
                families[current_id] = {
                    "ged_id": current_id, "husb": "", "wife": "", "chil": [], "marr_date": "", "marr_place": ""
                }
            else:
                current = None
                current_id = None
        elif current == "INDI" and current_id:
            rec = individuals[current_id]
            if lvl == 1:
                current_sub = tag
                if tag == "NAME":
                    rec["name"] = value
                elif tag == "SEX":
                    rec["sex"] = value
                elif tag == "FAMC":
                    rec["famc"] = value.strip("@")
                elif tag == "FAMS":
                    rec["fams"].append(value.strip("@"))
            elif lvl == 2 and current_sub in ("BIRT", "DEAT"):
                if tag == "DATE":
                    rec["birth_date" if current_sub == "BIRT" else "death_date"] = norm_date(value)
                elif tag == "PLAC":
                    rec["birth_place" if current_sub == "BIRT" else "death_place"] = clean_place(value)
        elif current == "FAM" and current_id:
            rec = families[current_id]
            if lvl == 1:
                current_sub = tag
                if tag == "HUSB":
                    rec["husb"] = value.strip("@")
                elif tag == "WIFE":
                    rec["wife"] = value.strip("@")
                elif tag == "CHIL":
                    rec["chil"].append(value.strip("@"))
            elif lvl == 2 and current_sub == "MARR":
                if tag == "DATE":
                    rec["marr_date"] = norm_date(value)
                elif tag == "PLAC":
                    rec["marr_place"] = clean_place(value)
    return individuals, families

def read_map(path):
    out = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        t = line.strip()
        if not t or t.startswith("#"):
            continue
        typ, ged, seq = t.split("|")
        out[(typ, ged)] = seq
    return out

def seq_from_map(mapping, typ, prefix):
    nums = [int(v[1:]) for (t, _), v in mapping.items() if t == typ and v.startswith(prefix)]
    return (max(nums) if nums else 0) + 1

indi, fam = parse_ged(ged_path)
mapping = read_map(map_file)

next_p = seq_from_map(mapping, "PERSONA", "P")
next_f = seq_from_map(mapping, "FAMIGLIA", "F")

def get_or_make(typ, ged_id):
    global next_p, next_f
    key = (typ, ged_id)
    if key in mapping:
        return mapping[key]
    if typ == "PERSONA":
        val = f"P{next_p:06d}"
        next_p += 1
    else:
        val = f"F{next_f:06d}"
        next_f += 1
    mapping[key] = val
    return val

for gid in sorted(indi):
    get_or_make("PERSONA", gid)
for gid in sorted(fam):
    get_or_make("FAMIGLIA", gid)

source_id = "S000001"
today = datetime.date.today().isoformat()
sources_lines = [
    "# FONTI.DAT",
    "# ID|TIPO|TITOLO|DATA_DOCUMENTO|ARCHIVIO|RIFERIMENTO|URL|NOTE",
    f"{source_id}|GEDCOM|IMPORT GEDCOM LATEST|{today}|data/import/raw|latest.ged||IMPORT_AUTOMATICO"
]

people_lines = [
    "# PERSONE.DAT",
    "# ID|GEDCOM_ID|COGNOME|NOME|SESSO|DATA_NASCITA|LUOGO_NASCITA|DATA_MORTE|LUOGO_MORTE|FAMIGLIA_ORIGINE|FAMIGLIA_PRINCIPALE|ID_FONTI|NOTE"
]
dup_idx = {}
dup_rows = []
for gid in sorted(indi, key=lambda x: mapping[("PERSONA", x)]):
    rec = indi[gid]
    pid = mapping[("PERSONA", gid)]
    cognome, nome = split_name(rec["name"] or gid)
    famc = mapping.get(("FAMIGLIA", rec["famc"]), "") if rec["famc"] else ""
    fams = mapping.get(("FAMIGLIA", rec["fams"][0]), "") if rec["fams"] else ""
    key = (cognome.upper(), nome.upper(), rec["birth_date"])
    dup_idx.setdefault(key, []).append(pid)
    people_lines.append("|".join([
        pid, gid, cognome, nome, rec["sex"], rec["birth_date"], rec["birth_place"],
        rec["death_date"], rec["death_place"], famc, fams, source_id, "IMPORT_GEDCOM"
    ]))

for k, vals in dup_idx.items():
    if len(vals) > 1:
        dup_rows.append(f"DUP|{k[0]}|{k[1]}|{k[2]}|IDS={','.join(vals)}")

families_lines = [
    "# FAMIGLIE.DAT",
    "# ID|GEDCOM_ID|COGNOME_FAMIGLIA|ID_HUSB|ID_WIFE|ID_FIGLI|DATA_MATRIMONIO|LUOGO_MATRIMONIO|ID_FONTI|NOTE"
]
for gid in sorted(fam, key=lambda x: mapping[("FAMIGLIA", x)]):
    rec = fam[gid]
    fid = mapping[("FAMIGLIA", gid)]
    husb = mapping.get(("PERSONA", rec["husb"]), "") if rec["husb"] else ""
    wife = mapping.get(("PERSONA", rec["wife"]), "") if rec["wife"] else ""
    children = [mapping.get(("PERSONA", c), "") for c in rec["chil"]]
    children = [c for c in children if c]
    h_surname = ""
    w_surname = ""
    if rec["husb"] and rec["husb"] in indi:
        h_surname = split_name(indi[rec["husb"]]["name"])[0]
    if rec["wife"] and rec["wife"] in indi:
        w_surname = split_name(indi[rec["wife"]]["name"])[0]
    fam_name = f"{h_surname}-{w_surname}".strip("-")
    families_lines.append("|".join([
        fid, gid, fam_name, husb, wife, ",".join(children),
        rec["marr_date"], rec["marr_place"], source_id, "IMPORT_GEDCOM"
    ]))

events_lines = [
    "# EVENTI.DAT",
    "# ID|TIPO_EVENTO|DATA_EVENTO|LUOGO|ID_PERSONA|ID_FAMIGLIA|ID_FONTE|DETTAGLIO"
]
eid = 1
for gid in sorted(indi, key=lambda x: mapping[("PERSONA", x)]):
    rec = indi[gid]
    pid = mapping[("PERSONA", gid)]
    if rec["birth_date"] or rec["birth_place"]:
        events_lines.append(f"E{eid:06d}|BIRT|{rec['birth_date']}|{rec['birth_place']}|{pid}||{source_id}|IMPORT_GEDCOM")
        eid += 1
    if rec["death_date"] or rec["death_place"]:
        events_lines.append(f"E{eid:06d}|DEAT|{rec['death_date']}|{rec['death_place']}|{pid}||{source_id}|IMPORT_GEDCOM")
        eid += 1
for gid in sorted(fam, key=lambda x: mapping[("FAMIGLIA", x)]):
    rec = fam[gid]
    fid = mapping[("FAMIGLIA", gid)]
    if rec["marr_date"] or rec["marr_place"]:
        events_lines.append(f"E{eid:06d}|MARR|{rec['marr_date']}|{rec['marr_place']}||{fid}|{source_id}|IMPORT_GEDCOM")
        eid += 1

people_file.write_text("\n".join(people_lines) + "\n", encoding="utf-8")
families_file.write_text("\n".join(families_lines) + "\n", encoding="utf-8")
sources_file.write_text("\n".join(sources_lines) + "\n", encoding="utf-8")
events_file.write_text("\n".join(events_lines) + "\n", encoding="utf-8")

map_lines = [
    "# GEDMAP.DAT",
    "# TIPO|GED_ID|ID_SEQ",
]
for (typ, gid), seq in sorted(mapping.items(), key=lambda x: (x[0][0], x[1])):
    map_lines.append(f"{typ}|{gid}|{seq}")
map_file.write_text("\n".join(map_lines) + "\n", encoding="utf-8")

if dup_rows:
    dupe_file.write_text("\n".join(dup_rows) + "\n", encoding="utf-8")
else:
    dupe_file.write_text("# NO DUPLICATES DETECTED\n", encoding="utf-8")

print(f"IMPORT|PEOPLE={len(indi)}|FAMILIES={len(fam)}")
print(f"OUTPUT|{people_file}")
print(f"OUTPUT|{families_file}")
print(f"OUTPUT|{sources_file}")
print(f"OUTPUT|{events_file}")
print(f"LOG|{dupe_file}")
PY
