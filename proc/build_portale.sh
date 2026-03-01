#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT_DIR/data"
PORTALE_DIR="$ROOT_DIR/PORTALE_GN"
GEN_DIR="$PORTALE_DIR/generated"
OUT_DIR="$ROOT_DIR/out"
LOG_DIR="$ROOT_DIR/logs"

mkdir -p "$GEN_DIR" "$OUT_DIR" "$LOG_DIR"

"$ROOT_DIR/proc/validate_data.sh"

python3 - "$DATA_DIR" "$GEN_DIR" "$OUT_DIR" <<'PY' | tee "$LOG_DIR/build_latest.log"
import datetime
import html
import pathlib
import sys

data_dir = pathlib.Path(sys.argv[1])
gen_dir = pathlib.Path(sys.argv[2])
out_dir = pathlib.Path(sys.argv[3])

people_dir = gen_dir / "people"
families_dir = gen_dir / "families"
sources_dir = gen_dir / "sources"
reports_dir = gen_dir / "reports"

for d in (people_dir, families_dir, sources_dir, reports_dir):
    d.mkdir(parents=True, exist_ok=True)

def load_rows(path):
    rows = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        rows.append(line.split("|"))
    return rows

people = load_rows(data_dir / "PERSONE.DAT")
families = load_rows(data_dir / "FAMIGLIE.DAT")
sources = load_rows(data_dir / "FONTI.DAT")
events = load_rows(data_dir / "EVENTI.DAT")

people_by_id = {r[0]: r for r in people}
families_by_id = {r[0]: r for r in families}
sources_by_id = {r[0]: r for r in sources}

source_to_people = {sid: [] for sid in sources_by_id}
for p in people:
    pid, _, _, _, _, _, _, _, _, src_list, _, _ = p
    for sid in [x.strip() for x in src_list.split(",") if x.strip()]:
        source_to_people.setdefault(sid, []).append(pid)

source_to_families = {sid: [] for sid in sources_by_id}
for f in families:
    fid, _, _, _, _, src_list, _ = f
    for sid in [x.strip() for x in src_list.split(",") if x.strip()]:
        source_to_families.setdefault(sid, []).append(fid)

def base_page(title, body, css_rel, js_rel):
    return f"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<link rel="stylesheet" href="{css_rel}">
</head>
<body>
<div class="terminal">
  <header class="sys-header">
    <span class="sys-id">SIG-GN</span>
    <span class="sys-meta">COBOL UNIX STYLE | RECORD-ORIENTED FILES</span>
    <span class="screen-id">GENERATED</span>
  </header>
  <nav class="breadcrumb">
    <a href="../index.html">HOME</a> <span class="sep">/</span>
    <a href="index.html">GENERATED</a>
  </nav>
  <div class="section">
    <div class="section-hdr">{html.escape(title)}</div>
    <div class="section-body">
{body}
    </div>
  </div>
  <footer class="pf-bar">
    <a class="pf" href="../index.html"><span class="pf-k">PF1</span><span class="pf-l">HOME</span></a>
    <a class="pf" href="../famiglie.html"><span class="pf-k">PF3</span><span class="pf-l">FAMIGLIE</span></a>
    <a class="pf" href="index.html"><span class="pf-k">PF4</span><span class="pf-l">GENERATED</span></a>
  </footer>
</div>
<script src="{js_rel}"></script>
</body>
</html>
"""

def write(path, txt):
    path.write_text(txt, encoding="utf-8")

def esc(v):
    return html.escape(v or "")

generated_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Root generated index
root_body = f"""
      <div class="field-pair"><span class="fl">SORGENTE DATI:</span><span class="fv">data/*.DAT (file sequenziali)</span></div>
      <div class="field-pair"><span class="fl">GENERATO IL:</span><span class="fv">{generated_at}</span></div>
      <div class="field-pair"><span class="fl">PERSONE:</span><span class="fv">{len(people)} | <a href="people/index.html">APRIRE INDICE</a></span></div>
      <div class="field-pair"><span class="fl">FAMIGLIE:</span><span class="fv">{len(families)} | <a href="families/index.html">APRIRE INDICE</a></span></div>
      <div class="field-pair"><span class="fl">FONTI:</span><span class="fv">{len(sources)} | <a href="sources/index.html">APRIRE INDICE</a></span></div>
      <div class="field-pair"><span class="fl">REPORT:</span><span class="fv"><a href="reports/index.html">STATO GENERAZIONE</a></span></div>
"""
write(gen_dir / "index.html", base_page("GN-GEN INDEX", root_body, "../terminal.css", "../terminal.js"))

# People index + detail
rows_people = []
for p in people:
    pid, cognome, nome, sesso, dn, ln, dm, lm, fid, src_list, note, stato = p
    rows_people.append(
        f'<tr><td class="td-id">{esc(pid)}</td><td class="td-n"><a href="{esc(pid)}.html">{esc(cognome)} {esc(nome)}</a></td>'
        f'<td class="td-grp">{esc(fid)}</td><td>{esc(stato)}</td></tr>'
    )

    src_links = []
    for sid in [x.strip() for x in src_list.split(",") if x.strip()]:
        src_links.append(f'<a href="../sources/{esc(sid)}.html">{esc(sid)}</a>')
    fam_link = f'<a href="../families/{esc(fid)}.html">{esc(fid)}</a>' if fid else "-"

    body = f"""
      <div class="field-pair"><span class="fl">ID:</span><span class="fv">{esc(pid)}</span></div>
      <div class="field-pair"><span class="fl">NOME:</span><span class="fv">{esc(cognome)} {esc(nome)}</span></div>
      <div class="field-pair"><span class="fl">SESSO:</span><span class="fv">{esc(sesso)}</span></div>
      <div class="field-pair"><span class="fl">NASCITA:</span><span class="fv">{esc(dn)} {esc(ln)}</span></div>
      <div class="field-pair"><span class="fl">MORTE:</span><span class="fv">{esc(dm)} {esc(lm)}</span></div>
      <div class="field-pair"><span class="fl">FAMIGLIA:</span><span class="fv">{fam_link}</span></div>
      <div class="field-pair"><span class="fl">FONTI:</span><span class="fv">{', '.join(src_links) if src_links else '-'}</span></div>
      <div class="field-pair"><span class="fl">NOTE:</span><span class="fv">{esc(note)}</span></div>
      <div class="field-pair"><span class="fl">STATO:</span><span class="fv">{esc(stato)}</span></div>
      <div class="divider">------------------------------------------------------------</div>
      <a href="index.html">Torna a indice persone</a>
    """
    write(people_dir / f"{pid}.html", base_page(f"PERSONA {pid}", body, "../../terminal.css", "../../terminal.js"))

people_index_body = f"""
      <table class="tbl">
      <thead><tr><th>ID</th><th>Persona</th><th>Famiglia</th><th>Stato</th></tr></thead>
      <tbody>
      {''.join(rows_people)}
      </tbody></table>
"""
write(people_dir / "index.html", base_page("INDICE PERSONE", people_index_body, "../../terminal.css", "../../terminal.js"))

# Family index + detail
rows_fam = []
members_by_family = {}
for p in people:
    fid = p[8]
    if fid:
        members_by_family.setdefault(fid, []).append(p[0])

for f in families:
    fid, nome, macro, tipo, origine, src_list, note = f
    rows_fam.append(
        f'<tr><td class="td-id">{esc(fid)}</td><td class="td-n"><a href="{esc(fid)}.html">{esc(nome)}</a></td>'
        f'<td>{esc(macro)}</td><td>{esc(tipo)}</td></tr>'
    )

    src_links = []
    for sid in [x.strip() for x in src_list.split(",") if x.strip()]:
        src_links.append(f'<a href="../sources/{esc(sid)}.html">{esc(sid)}</a>')
    member_links = []
    for pid in members_by_family.get(fid, []):
        person = people_by_id.get(pid)
        label = f"{person[1]} {person[2]}" if person else pid
        member_links.append(f'<a href="../people/{esc(pid)}.html">{esc(label)}</a>')

    body = f"""
      <div class="field-pair"><span class="fl">ID:</span><span class="fv">{esc(fid)}</span></div>
      <div class="field-pair"><span class="fl">FAMIGLIA:</span><span class="fv">{esc(nome)}</span></div>
      <div class="field-pair"><span class="fl">MACRO GRUPPO:</span><span class="fv">{esc(macro)}</span></div>
      <div class="field-pair"><span class="fl">TIPO:</span><span class="fv">{esc(tipo)}</span></div>
      <div class="field-pair"><span class="fl">ORIGINE:</span><span class="fv">{esc(origine)}</span></div>
      <div class="field-pair"><span class="fl">FONTI:</span><span class="fv">{', '.join(src_links) if src_links else '-'}</span></div>
      <div class="field-pair"><span class="fl">MEMBRI:</span><span class="fv">{', '.join(member_links) if member_links else '-'}</span></div>
      <div class="field-pair"><span class="fl">NOTE:</span><span class="fv">{esc(note)}</span></div>
      <div class="divider">------------------------------------------------------------</div>
      <a href="index.html">Torna a indice famiglie</a>
    """
    write(families_dir / f"{fid}.html", base_page(f"FAMIGLIA {fid}", body, "../../terminal.css", "../../terminal.js"))

fam_index_body = f"""
      <table class="tbl">
      <thead><tr><th>ID</th><th>Famiglia</th><th>Macro</th><th>Tipo</th></tr></thead>
      <tbody>
      {''.join(rows_fam)}
      </tbody></table>
"""
write(families_dir / "index.html", base_page("INDICE FAMIGLIE", fam_index_body, "../../terminal.css", "../../terminal.js"))

# Sources index + detail
rows_src = []
for s in sources:
    sid, tipo, titolo, data_doc, archivio, rif, url, note = s
    rows_src.append(
        f'<tr><td class="td-id">{esc(sid)}</td><td class="td-n"><a href="{esc(sid)}.html">{esc(titolo)}</a></td>'
        f'<td>{esc(tipo)}</td><td>{esc(data_doc)}</td></tr>'
    )
    cited_people = []
    for pid in source_to_people.get(sid, []):
        person = people_by_id.get(pid)
        label = f"{person[1]} {person[2]}" if person else pid
        cited_people.append(f'<a href="../people/{esc(pid)}.html">{esc(label)}</a>')
    cited_families = []
    for fid in source_to_families.get(sid, []):
        family = families_by_id.get(fid)
        label = family[1] if family else fid
        cited_families.append(f'<a href="../families/{esc(fid)}.html">{esc(label)}</a>')

    url_out = f'<a href="{esc(url)}">{esc(url)}</a>' if url else "-"
    body = f"""
      <div class="field-pair"><span class="fl">ID:</span><span class="fv">{esc(sid)}</span></div>
      <div class="field-pair"><span class="fl">TIPO:</span><span class="fv">{esc(tipo)}</span></div>
      <div class="field-pair"><span class="fl">TITOLO:</span><span class="fv">{esc(titolo)}</span></div>
      <div class="field-pair"><span class="fl">DATA:</span><span class="fv">{esc(data_doc)}</span></div>
      <div class="field-pair"><span class="fl">ARCHIVIO:</span><span class="fv">{esc(archivio)}</span></div>
      <div class="field-pair"><span class="fl">RIFERIMENTO:</span><span class="fv">{esc(rif)}</span></div>
      <div class="field-pair"><span class="fl">URL:</span><span class="fv">{url_out}</span></div>
      <div class="field-pair"><span class="fl">NOTE:</span><span class="fv">{esc(note)}</span></div>
      <div class="field-pair"><span class="fl">PERSONE CITATE:</span><span class="fv">{', '.join(cited_people) if cited_people else '-'}</span></div>
      <div class="field-pair"><span class="fl">FAMIGLIE CITATE:</span><span class="fv">{', '.join(cited_families) if cited_families else '-'}</span></div>
      <div class="divider">------------------------------------------------------------</div>
      <a href="index.html">Torna a indice fonti</a>
    """
    write(sources_dir / f"{sid}.html", base_page(f"FONTE {sid}", body, "../../terminal.css", "../../terminal.js"))

src_index_body = f"""
      <table class="tbl">
      <thead><tr><th>ID</th><th>Titolo</th><th>Tipo</th><th>Data</th></tr></thead>
      <tbody>
      {''.join(rows_src)}
      </tbody></table>
"""
write(sources_dir / "index.html", base_page("INDICE FONTI", src_index_body, "../../terminal.css", "../../terminal.js"))

# Reports
report_body = f"""
      <div class="field-pair"><span class="fl">GENERATO IL:</span><span class="fv">{generated_at}</span></div>
      <div class="field-pair"><span class="fl">TOT PERSONE:</span><span class="fv">{len(people)}</span></div>
      <div class="field-pair"><span class="fl">TOT FAMIGLIE:</span><span class="fv">{len(families)}</span></div>
      <div class="field-pair"><span class="fl">TOT FONTI:</span><span class="fv">{len(sources)}</span></div>
      <div class="field-pair"><span class="fl">TOT EVENTI:</span><span class="fv">{len(events)}</span></div>
      <div class="field-pair"><span class="fl">INDICI:</span><span class="fv"><a href="../people/index.html">PERSONE</a> | <a href="../families/index.html">FAMIGLIE</a> | <a href="../sources/index.html">FONTI</a></span></div>
"""
write(reports_dir / "index.html", base_page("REPORT GENERAZIONE", report_body, "../../terminal.css", "../../terminal.js"))

# Flat textual index for technical use
lista_dat = [
    "# LISTA.DAT",
    "# TIPO|ID|LABEL|PATH_RELATIVO",
]
for p in people:
    lista_dat.append(f"PERSONA|{p[0]}|{p[1]} {p[2]}|people/{p[0]}.html")
for f in families:
    lista_dat.append(f"FAMIGLIA|{f[0]}|{f[1]}|families/{f[0]}.html")
for s in sources:
    lista_dat.append(f"FONTE|{s[0]}|{s[2]}|sources/{s[0]}.html")
write(gen_dir / "LISTA.DAT", "\n".join(lista_dat) + "\n")
write(out_dir / "BUILD_INDEX.DAT", "\n".join(lista_dat) + "\n")

print("BUILD REPORT")
print("============")
print(f"GENERATED|DIR={gen_dir}")
print(f"PEOPLE|COUNT={len(people)}")
print(f"FAMILIES|COUNT={len(families)}")
print(f"SOURCES|COUNT={len(sources)}")
print(f"EVENTS|COUNT={len(events)}")
PY
