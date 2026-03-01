#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT_DIR/data"
AR_DIR="$DATA_DIR/araldica"
PORTALE="$ROOT_DIR/PORTALE_GN"
LOG_DIR="$ROOT_DIR/logs"
OUT_DIR="$ROOT_DIR/out"

mkdir -p "$PORTALE/people" "$PORTALE/families" "$PORTALE/sources" "$PORTALE/heraldry" "$PORTALE/reports" "$LOG_DIR" "$OUT_DIR"

"$ROOT_DIR/proc/validate_data.sh"

python3 - "$ROOT_DIR" "$DATA_DIR" "$AR_DIR" "$PORTALE" "$LOG_DIR" "$OUT_DIR" <<'PY' | tee "$LOG_DIR/build_latest.log"
import datetime
import html
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])
data_dir = pathlib.Path(sys.argv[2])
ar_dir = pathlib.Path(sys.argv[3])
portale = pathlib.Path(sys.argv[4])
log_dir = pathlib.Path(sys.argv[5])
out_dir = pathlib.Path(sys.argv[6])

def load(path):
    rows = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        rows.append(line.split("|"))
    return rows

people = load(data_dir / "PERSONE.DAT")
families = load(data_dir / "FAMIGLIE.DAT")
sources = load(data_dir / "FONTI.DAT")
events = load(data_dir / "EVENTI.DAT")
casati = load(ar_dir / "CASATI.DAT")
rami = load(ar_dir / "RAMI.DAT")
stemmi = load(ar_dir / "STEMMI.DAT")
apps = load(ar_dir / "APPARTENENZE.DAT")

p_by = {r[0]: r for r in people}
f_by = {r[0]: r for r in families}
s_by = {r[0]: r for r in sources}
c_by = {r[0]: r for r in casati}
r_by = {r[0]: r for r in rami}
h_by = {r[0]: r for r in stemmi}

apps_by_person = {}
for a in apps:
    apps_by_person.setdefault(a[1], []).append(a)

def esc(v):
    return html.escape(v or "")

def parse_partial_date(v):
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

def person_ref_date(p):
    b = parse_partial_date(p[5])
    d = parse_partial_date(p[7])
    if b and d:
        delta = d - b
        return b + datetime.timedelta(days=max(0, delta.days // 2))
    if b:
        return b
    if d:
        return d
    return None

def in_range(ref, dal, al):
    if ref is None:
        return True
    d1 = parse_partial_date(dal) if dal else None
    d2 = parse_partial_date(al) if al else None
    if d1 and ref < d1:
        return False
    if d2 and ref > d2:
        return False
    return True

def choose_app(person_id, ref):
    candidates = [a for a in apps_by_person.get(person_id, []) if in_range(ref, a[5], a[6])]
    if not candidates:
        return None
    candidates.sort(key=lambda x: parse_partial_date(x[5]) or datetime.date(1, 1, 1), reverse=True)
    return candidates[0]

def choose_stemma(casato_id, ramo_id, ref):
    def select(cands):
        valid = [h for h in cands if in_range(ref, h[6], h[7])]
        if not valid:
            return None
        valid.sort(key=lambda x: int(x[8]), reverse=True)
        return valid[0]
    c1 = [h for h in stemmi if h[1] == casato_id and h[2] == ramo_id and ramo_id]
    s = select(c1)
    if s:
        return s
    c2 = [h for h in stemmi if h[1] == casato_id and not h[2]]
    s = select(c2)
    if s:
        return s
    c3 = [h for h in stemmi if h[1] == casato_id and h[3] == "ARMIGERIA_BASE"]
    return select(c3)

missing_assets = []

def render_stemma_block(person):
    pref = person_ref_date(person)
    app = choose_app(person[0], pref)
    if not app:
        return ("Nessuna appartenenza araldica", "", "", "", "")
    cas = c_by.get(app[2], ["", "", "", "", "", "", ""])
    ramo = r_by.get(app[3], ["", "", "", "", "", ""]) if app[3] else ["", "", "", "", "", ""]
    st = choose_stemma(app[2], app[3], pref)
    if not st:
        return (f"{cas[1]} (nessuno stemma disponibile)", "", "", "", "")
    img = st[5]
    abs_img = root / "PORTALE_GN" / img if img else None
    img_html = ""
    if img and abs_img and abs_img.exists():
        img_html = f'<img src="../{esc(img)}" alt="{esc(st[0])}" style="max-width:180px;border:1px solid var(--border-hi);">'
    else:
        missing_assets.append(f"MISSING_ASSET|{st[0]}|{img}")
        img_html = '<div class="alert alert-warn">ASSET STEMMA NON DISPONIBILE</div>'
    detail = f"{st[3]} | DAL={st[6]} AL={st[7]} | PRIORITA={st[8]}"
    return (f"{cas[1]} / {ramo[2] if app[3] else 'BASE'}", st[0], detail, img_html, st[0])

def base_page(title, breadcrumb, body):
    return f"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<link rel="stylesheet" href="../terminal.css">
</head>
<body>
<div class="terminal">
  <header class="sys-header"><span class="sys-id">SIG-GN</span><span class="sys-meta">BUILD COBOL UNIX</span><span class="screen-id">{esc(title)}</span></header>
  <nav class="breadcrumb">{breadcrumb}</nav>
  <div class="section"><div class="section-hdr">{esc(title)}</div><div class="section-body">{body}</div></div>
  <footer class="pf-bar">
    <a class="pf" href="../index.html"><span class="pf-k">PF1</span><span class="pf-l">HOME</span></a>
    <a class="pf" href="../people/index.html"><span class="pf-k">PF4</span><span class="pf-l">PEOPLE</span></a>
    <a class="pf" href="../families/index.html"><span class="pf-k">PF5</span><span class="pf-l">FAMILIES</span></a>
    <a class="pf" href="../sources/index.html"><span class="pf-k">PF6</span><span class="pf-l">SOURCES</span></a>
    <a class="pf" href="../heraldry/index.html"><span class="pf-k">PF7</span><span class="pf-l">HERALDRY</span></a>
  </footer>
</div>
<script src="../terminal.js"></script>
</body>
</html>
"""

def write(path, txt):
    path.write_text(txt, encoding="utf-8")

# People pages/index
rows = []
for p in people:
    pid = p[0]
    family_link = f'<a href="../families/{p[10]}.html">{p[10]}</a>' if p[10] else "-"
    source_links = ", ".join([f'<a href="../sources/{sid}.html">{sid}</a>' for sid in p[11].split(",") if sid])
    stemma_label, stemma_id, stemma_detail, stemma_img, stemma_link_id = render_stemma_block(p)
    stemma_link = f'<a href="../heraldry/{stemma_link_id}.html">{stemma_link_id}</a>' if stemma_link_id else "-"
    body = f"""
    <div class="field-pair"><span class="fl">ID:</span><span class="fv">{esc(pid)}</span></div>
    <div class="field-pair"><span class="fl">NOME:</span><span class="fv">{esc(p[2])} {esc(p[3])}</span></div>
    <div class="field-pair"><span class="fl">NASCITA:</span><span class="fv">{esc(p[5])} {esc(p[6])}</span></div>
    <div class="field-pair"><span class="fl">MORTE:</span><span class="fv">{esc(p[7])} {esc(p[8])}</span></div>
    <div class="field-pair"><span class="fl">FAMIGLIA:</span><span class="fv">{family_link}</span></div>
    <div class="field-pair"><span class="fl">FONTI:</span><span class="fv">{source_links or '-'}</span></div>
    <div class="divider">---------------- STEMMA RISOLTO ----------------</div>
    <div class="field-pair"><span class="fl">APPARTENENZA:</span><span class="fv">{esc(stemma_label)}</span></div>
    <div class="field-pair"><span class="fl">SCHEDA STEMMA:</span><span class="fv">{stemma_link}</span></div>
    <div class="field-pair"><span class="fl">DETTAGLIO:</span><span class="fv">{esc(stemma_detail)}</span></div>
    <div style="margin-top:6px;">{stemma_img}</div>
    """
    write(portale / "people" / f"{pid}.html", base_page(f"PERSONA {pid}", f'<a href="../index.html">HOME</a> / <a href="index.html">PEOPLE</a> / <span class="curr">{pid}</span>', body))
    rows.append(f'<tr><td class="td-id">{pid}</td><td class="td-n"><a href="{pid}.html">{esc(p[2])} {esc(p[3])}</a></td><td>{esc(p[10])}</td></tr>')

people_idx = f'<table class="tbl"><thead><tr><th>ID</th><th>Persona</th><th>Famiglia</th></tr></thead><tbody>{"".join(rows)}</tbody></table>'
write(portale / "people" / "index.html", base_page("INDICE PERSONE", '<a href="../index.html">HOME</a> / <span class="curr">PEOPLE</span>', people_idx))

# Families
rows = []
for f in families:
    fid = f[0]
    members = [f[3], f[4]] + [x for x in f[5].split(",") if x]
    member_links = []
    for pid in [m for m in members if m]:
        pp = p_by.get(pid)
        label = f"{pp[2]} {pp[3]}" if pp else pid
        member_links.append(f'<a href="../people/{pid}.html">{esc(label)}</a>')
    body = f"""
    <div class="field-pair"><span class="fl">ID:</span><span class="fv">{fid}</span></div>
    <div class="field-pair"><span class="fl">NOME:</span><span class="fv">{esc(f[2])}</span></div>
    <div class="field-pair"><span class="fl">MATRIMONIO:</span><span class="fv">{esc(f[6])} {esc(f[7])}</span></div>
    <div class="field-pair"><span class="fl">MEMBRI:</span><span class="fv">{", ".join(member_links) if member_links else "-"}</span></div>
    """
    write(portale / "families" / f"{fid}.html", base_page(f"FAMIGLIA {fid}", f'<a href="../index.html">HOME</a> / <a href="index.html">FAMILIES</a> / <span class="curr">{fid}</span>', body))
    rows.append(f'<tr><td class="td-id">{fid}</td><td class="td-n"><a href="{fid}.html">{esc(f[2])}</a></td><td>{esc(f[6])}</td></tr>')
fam_idx = f'<table class="tbl"><thead><tr><th>ID</th><th>Famiglia</th><th>Data</th></tr></thead><tbody>{"".join(rows)}</tbody></table>'
write(portale / "families" / "index.html", base_page("INDICE FAMIGLIE", '<a href="../index.html">HOME</a> / <span class="curr">FAMILIES</span>', fam_idx))

# Sources
rows = []
for s in sources:
    sid = s[0]
    cited = []
    for p in people:
        if sid in [x for x in p[11].split(",") if x]:
            cited.append(f'<a href="../people/{p[0]}.html">{esc(p[2])} {esc(p[3])}</a>')
    body = f"""
    <div class="field-pair"><span class="fl">ID:</span><span class="fv">{sid}</span></div>
    <div class="field-pair"><span class="fl">TIPO:</span><span class="fv">{esc(s[1])}</span></div>
    <div class="field-pair"><span class="fl">TITOLO:</span><span class="fv">{esc(s[2])}</span></div>
    <div class="field-pair"><span class="fl">RIF:</span><span class="fv">{esc(s[5])}</span></div>
    <div class="field-pair"><span class="fl">PERSONE CITATE:</span><span class="fv">{", ".join(cited) if cited else "-"}</span></div>
    """
    write(portale / "sources" / f"{sid}.html", base_page(f"FONTE {sid}", f'<a href="../index.html">HOME</a> / <a href="index.html">SOURCES</a> / <span class="curr">{sid}</span>', body))
    rows.append(f'<tr><td class="td-id">{sid}</td><td class="td-n"><a href="{sid}.html">{esc(s[2])}</a></td><td>{esc(s[1])}</td></tr>')
src_idx = f'<table class="tbl"><thead><tr><th>ID</th><th>Titolo</th><th>Tipo</th></tr></thead><tbody>{"".join(rows)}</tbody></table>'
write(portale / "sources" / "index.html", base_page("INDICE FONTI", '<a href="../index.html">HOME</a> / <span class="curr">SOURCES</span>', src_idx))

# Heraldry
rows = []
for h in stemmi:
    hid = h[0]
    cas = c_by.get(h[1], ["", "N/D", "", "", "", "", ""])
    ramo = r_by.get(h[2], ["", "","BASE","","",""]) if h[2] else ["", "", "BASE", "", "", ""]
    img = h[5]
    img_abs = root / "PORTALE_GN" / img if img else None
    img_html = f'<img src="../{esc(img)}" alt="{hid}" style="max-width:220px;border:1px solid var(--border-hi);">' if img and img_abs and img_abs.exists() else '<div class="alert alert-warn">ASSET NON PRESENTE</div>'
    if img and (not img_abs or not img_abs.exists()):
        missing_assets.append(f"MISSING_ASSET|{hid}|{img}")
    body = f"""
    <div class="field-pair"><span class="fl">ID STEMMA:</span><span class="fv">{hid}</span></div>
    <div class="field-pair"><span class="fl">CASATO:</span><span class="fv">{esc(cas[1])}</span></div>
    <div class="field-pair"><span class="fl">RAMO:</span><span class="fv">{esc(ramo[2])}</span></div>
    <div class="field-pair"><span class="fl">TIPO:</span><span class="fv">{esc(h[3])}</span></div>
    <div class="field-pair"><span class="fl">RANGE:</span><span class="fv">{esc(h[6])} - {esc(h[7])}</span></div>
    <div class="field-pair"><span class="fl">PRIORITA:</span><span class="fv">{esc(h[8])}</span></div>
    <div class="field-pair"><span class="fl">BLAZONE:</span><span class="fv">{esc(h[4])}</span></div>
    <div style="margin-top:8px;">{img_html}</div>
    """
    write(portale / "heraldry" / f"{hid}.html", base_page(f"STEMMA {hid}", f'<a href="../index.html">HOME</a> / <a href="index.html">HERALDRY</a> / <span class="curr">{hid}</span>', body))
    rows.append(f'<tr><td class="td-id">{hid}</td><td class="td-n"><a href="{hid}.html">{esc(cas[1])}</a></td><td>{esc(ramo[2])}</td><td>{esc(h[3])}</td></tr>')

her_idx = f'<table class="tbl"><thead><tr><th>ID</th><th>Casato</th><th>Ramo</th><th>Tipo</th></tr></thead><tbody>{"".join(rows)}</tbody></table>'
write(portale / "heraldry" / "index.html", base_page("INDICE STEMMI", '<a href="../index.html">HOME</a> / <span class="curr">HERALDRY</span>', her_idx))

# Reports
report_body = f"""
<div class="field-pair"><span class="fl">GENERATO:</span><span class="fv">{datetime.datetime.now().isoformat(sep=' ', timespec='seconds')}</span></div>
<div class="field-pair"><span class="fl">PERSONE:</span><span class="fv">{len(people)}</span></div>
<div class="field-pair"><span class="fl">FAMIGLIE:</span><span class="fv">{len(families)}</span></div>
<div class="field-pair"><span class="fl">FONTI:</span><span class="fv">{len(sources)}</span></div>
<div class="field-pair"><span class="fl">EVENTI:</span><span class="fv">{len(events)}</span></div>
<div class="field-pair"><span class="fl">STEMMI:</span><span class="fv">{len(stemmi)}</span></div>
<div class="field-pair"><span class="fl">MISSING ASSETS:</span><span class="fv">{len(missing_assets)}</span></div>
"""
write(portale / "reports" / "index.html", base_page("REPORT BUILD", '<a href="../index.html">HOME</a> / <span class="curr">REPORTS</span>', report_body))

(out_dir / "BUILD_INDEX.DAT").write_text(
    "\n".join([
        "# BUILD_INDEX.DAT",
        "# TIPO|ID|LABEL|PATH_RELATIVO",
        *[f"PERSONA|{p[0]}|{p[2]} {p[3]}|people/{p[0]}.html" for p in people],
        *[f"FAMIGLIA|{f[0]}|{f[2]}|families/{f[0]}.html" for f in families],
        *[f"FONTE|{s[0]}|{s[2]}|sources/{s[0]}.html" for s in sources],
        *[f"STEMMA|{h[0]}|{h[1]}|heraldry/{h[0]}.html" for h in stemmi],
    ]) + "\n",
    encoding="utf-8",
)

(log_dir / "missing_heraldry_assets.log").write_text(
    ("\n".join(sorted(set(missing_assets))) if missing_assets else "# NONE") + "\n",
    encoding="utf-8",
)

print(f"BUILD|PEOPLE={len(people)}|FAMILIES={len(families)}|SOURCES={len(sources)}|HERALDRY={len(stemmi)}")
PY
