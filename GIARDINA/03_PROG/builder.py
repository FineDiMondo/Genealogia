from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

from common import INDEX_DIR, RC_ERROR, RC_OK, REPORTS_DIR, SITE_DIR, JobResult, ensure_layout, load_records, write_json, write_text
from validator import validate_records


def _html(title: str, body: str) -> str:
    return f"""<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <style>
    body{{font-family: 'Courier New', monospace; background:#f5f1e8; color:#2a2317; margin:0; padding:1.5rem;}}
    a{{color:#5b3a1d;}} .box{{border:1px solid #bca884;background:#fffdf8;padding:1rem;margin:0 0 1rem 0;}}
    table{{width:100%;border-collapse:collapse;}} th,td{{border:1px solid #bca884;padding:0.4rem;text-align:left;}}
    .meta{{font-size:0.85rem; color:#5a5045;}}
  </style>
</head>
<body>{body}</body></html>"""


def _write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def _record_title(record: dict[str, Any]) -> str:
    return str(record.get("title") or record.get("name") or record.get("id"))


def _bucket(records: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    out: dict[str, list[dict[str, Any]]] = {}
    for record in records:
        key = str(record.get("type", "")).upper()
        out.setdefault(key, []).append(record)
    for values in out.values():
        values.sort(key=lambda x: (x.get("date", {}).get("sort", ""), x.get("id", "")))
    return out


def build_site() -> JobResult:
    ensure_layout()
    check = validate_records()
    if check.rc == RC_ERROR:
        return check

    if SITE_DIR.exists():
        shutil.rmtree(SITE_DIR)
    SITE_DIR.mkdir(parents=True, exist_ok=True)

    records = load_records()
    records.sort(key=lambda x: (x.get("date", {}).get("sort", ""), x.get("id", "")))
    records_by_id = {str(r.get("id", "")): r for r in records}
    buckets = _bucket(records)

    # Timeline + filters
    rows = []
    for record in records:
        rid = str(record.get("id", ""))
        rtype = str(record.get("type", "")).upper()
        rows.append(
            {
                "id": rid,
                "type": rtype,
                "title": _record_title(record),
                "date_sort": str(record.get("date", {}).get("sort", "")),
                "date_display": str(record.get("date", {}).get("display", "")),
                "place_id": str(record.get("place_id", "")),
                "reliability": str(record.get("reliability", "")),
                "url": f"{rtype.lower()}/{rid}.html",
                "tags": record.get("tags", []) if isinstance(record.get("tags"), list) else [],
            }
        )

    timeline_body = """
<div class="box"><h1>Portale Giardina - Timeline</h1><p><a href="./index.html">Dashboard</a></p></div>
<div class="box">
  <input id="q" placeholder="ricerca libera">
  <select id="t"><option value="">tipo</option></select>
  <select id="r"><option value="">attendibilità</option></select>
  <button onclick="f()">Filtra</button>
</div>
<div class="box"><table><thead><tr><th>Data</th><th>Tipo</th><th>Titolo</th><th>Luogo</th><th>Attendibilità</th></tr></thead><tbody id="tb"></tbody></table></div>
<script>
const rows=__ROWS__;
function fill(id,key){const e=document.getElementById(id);[...new Set(rows.map(r=>r[key]).filter(Boolean))].sort().forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;e.appendChild(o);});}
fill('t','type');fill('r','reliability');
function render(data){document.getElementById('tb').innerHTML=data.map(r=>`<tr><td>${r.date_display}</td><td>${r.type}</td><td><a href='${r.url}'>${r.title}</a></td><td>${r.place_id}</td><td>${r.reliability}</td></tr>`).join('');}
function f(){const q=document.getElementById('q').value.toLowerCase();const t=document.getElementById('t').value;const r=document.getElementById('r').value;render(rows.filter(x=>(!q||(`${x.id} ${x.title} ${x.place_id} ${x.tags.join(' ')}`.toLowerCase().includes(q)))&&(!t||x.type===t)&&(!r||x.reliability===r)));}render(rows);
</script>
"""
    _write(SITE_DIR / "timeline.html", _html("Timeline", timeline_body.replace("__ROWS__", json.dumps(rows, ensure_ascii=False))))

    # Dashboard
    stats = {k: len(v) for k, v in buckets.items()}
    dash = _html(
        "Portale Giardina",
        f"<div class='box'><h1>Portale Giardina</h1><p class='meta'>Batch build COBOL-like</p></div>"
        "<div class='box'><ul>"
        "<li><a href='./timeline.html'>Timeline</a></li>"
        "<li><a href='./family/index.html'>Famiglie</a></li>"
        "<li><a href='./person/index.html'>Persone</a></li>"
        "<li><a href='./source/index.html'>Fonti</a></li>"
        "<li><a href='./arms/index.html'>Stemmi</a></li>"
        "<li><a href='./place/index.html'>Luoghi</a></li>"
        "</ul></div>"
        f"<div class='box'>Totale record: {len(records)} | EVENT:{stats.get('EVENT',0)} PERSON:{stats.get('PERSON',0)} FAMILY:{stats.get('FAMILY',0)} SOURCE:{stats.get('SOURCE',0)} ARMS:{stats.get('ARMS',0)} PLACE:{stats.get('PLACE',0)}</div>",
    )
    _write(SITE_DIR / "index.html", dash)

    # Entity pages and indexes
    for rtype, values in buckets.items():
        list_items = []
        section = rtype.lower()
        for record in values:
            rid = str(record.get("id", ""))
            links = []
            for field, label in [("family_ids", "Famiglie"), ("person_ids", "Persone"), ("source_ids", "Fonti"), ("arms_ids", "Stemmi")]:
                ids = record.get(field, [])
                if isinstance(ids, list) and ids:
                    line = ", ".join([f"<a href='../{records_by_id[x]['type'].lower()}/{x}.html'>{x}</a>" for x in ids if x in records_by_id])
                    links.append(f"<p><strong>{label}:</strong> {line}</p>")
            page = _html(
                rid,
                f"<div class='box'><h1>{_record_title(record)}</h1><p class='meta'>{rid} | {record.get('type')} | {record.get('date',{}).get('display','')}</p>"
                "<p><a href='../index.html'>Dashboard</a> | <a href='../timeline.html'>Timeline</a></p></div>"
                f"<div class='box'><p><strong>Attendibilità:</strong> {record.get('reliability','')}</p><p><strong>Luogo:</strong> {record.get('place_id','')}</p>{''.join(links)}<p><strong>Note:</strong> {record.get('notes','')}</p></div>",
            )
            _write(SITE_DIR / section / f"{rid}.html", page)
            list_items.append(f"<li><a href='./{rid}.html'>{rid}</a> - {_record_title(record)}</li>")
        _write(SITE_DIR / section / "index.html", _html(f"{rtype} index", f"<div class='box'><h1>{rtype}</h1><ul>{''.join(list_items)}</ul></div><p><a href='../index.html'>Dashboard</a></p>"))

    search_index = [
        {
            "id": r["id"],
            "type": r["type"],
            "title": r["title"],
            "date_sort": r["date_sort"],
            "place_id": r["place_id"],
            "reliability": r["reliability"],
            "tags": r["tags"],
            "url": r["url"],
        }
        for r in rows
    ]
    write_json(SITE_DIR / "search-index.json", search_index)
    write_json(INDEX_DIR / "search-index.json", search_index)

    report_lines = [
        "JOB|BUILD",
        f"RECORDS|{len(records)}",
        f"WARNINGS|{len(check.warnings)}",
        "RETURN-CODE|0",
    ]
    write_text(REPORTS_DIR / "build_report.log", report_lines + check.warnings)
    quality_lines = [
        "REPORT|DATA_QUALITY",
        f"TOTAL_RECORDS|{len(records)}",
        f"EVENT|{len(buckets.get('EVENT', []))}",
        f"PERSON|{len(buckets.get('PERSON', []))}",
        f"FAMILY|{len(buckets.get('FAMILY', []))}",
        f"SOURCE|{len(buckets.get('SOURCE', []))}",
        f"ARMS|{len(buckets.get('ARMS', []))}",
        f"PLACE|{len(buckets.get('PLACE', []))}",
        f"WARNINGS|{len(check.warnings)}",
        "ANOMALIES|SEE_validate_report.log",
    ]
    write_text(REPORTS_DIR / "data_quality_report.log", quality_lines)
    return JobResult(rc=RC_OK, errors=[], warnings=check.warnings)
