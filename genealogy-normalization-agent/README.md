# Genealogy Normalization Agent

Toolkit locale per normalizzare record genealogici con interfacce:

- CLI (`gna-cli`)
- REST API FastAPI (`gna-api`)
- Web UI Flask (`gna-web`)
- Monitor daemon cartella input (`gna-daemon`)

## Quick start

```bash
cd genealogy-normalization-agent
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
pytest -q
```

Windows PowerShell:

```powershell
cd genealogy-normalization-agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest -q
```

## Directory I/O integrata

- `data/incoming`: GEDCOM in ingresso (`*.ged`)
- `data/normalized`: GEDCOM normalizzati + `_audit.json` + `_status.json`
- `data/gestionale/pending`: batch JSON in attesa revisione
- `data/gestionale/responses`: risposte approvazione/reiezione
- `data/gestionale/archive`: file processati archiviati

## Esecuzione

CLI demo:

```bash
python -m src.cli.cli run-demo
```

API:

```bash
python -m src.api.server
```

Web UI:

```bash
python -m src.web.app
```

Dashboard UI (Flask):

```bash
# after starting web app
# open http://127.0.0.1:5000/dashboard
```

Daemon:

```bash
python -m src.daemon.monitor --incoming data/incoming --normalized data/normalized
```

Pipeline completa (fase 7-8):

```bash
# 1) avvia daemon dual-monitor
python -m src.daemon.monitor \
  --incoming data/incoming \
  --normalized data/normalized \
  --gest-pending data/gestionale/pending \
  --gest-responses data/gestionale/responses \
  --gest-archive data/gestionale/archive

# 2) in un altro terminale esegui benchmark
python scripts/benchmark.py
```

## Docker

```bash
cp .env.example .env
docker compose up --build
```

## Struttura

- `src/agent`: engine, modelli, quality control
- `src/rules`: regole di normalizzazione
- `src/api`: endpoint FastAPI
- `src/cli`: comandi CLI
- `src/web`: mini interfaccia Flask
- `src/web/static/dashboard.*`: dashboard frontend CRT
- `src/dashboard`: persistence + metrics aggregation service (SQLite)
- `src/daemon`: monitor cartelle
- `src/exporters`: export JSON/GEDCOM
- `tests`: test automatici base
- `config/production.yaml`: configurazione produzione
- `docs/`: guide operative (installazione/API/CLI/daemon/troubleshooting/data flow)
