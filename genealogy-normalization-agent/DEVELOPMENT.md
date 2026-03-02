# Development Guide

## Setup ambiente

```bash
cd genealogy-normalization-agent
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .\.venv\Scripts\Activate.ps1  # Windows PowerShell
pip install -r requirements.txt
```

## Inizializzazione DB (prima esecuzione)

Il database SQLite viene creato automaticamente al primo avvio:

```bash
python -c "from src.dashboard.service import DashboardService; DashboardService()"
```

Output atteso: `data/dashboard/metrics.sqlite3` + `data/dashboard/targets.json`

## Comandi di sviluppo

```bash
# Demo CLI
python -m src.cli.cli run-demo

# API REST (FastAPI + Swagger su http://localhost:8000/docs)
python -m src.api.server

# Web UI + Dashboard (Flask su http://localhost:5000)
python -m src.web.app

# Daemon monitoraggio cartelle
python -m src.daemon.monitor \
  --incoming data/incoming \
  --normalized data/normalized \
  --gest-pending data/gestionale/pending \
  --gest-responses data/gestionale/responses \
  --gest-archive data/gestionale/archive
```

## Test

```bash
pytest tests/ -v
pytest tests/ -v --cov=src --cov-report=term-missing
```

## Struttura src/

```
src/
  agent/          engine, modelli dati, audit, quality, conflict resolver
  rules/          regole normalizzazione (date, nomi, luoghi, duplicati, relazioni)
  api/            FastAPI server + routes + schemas
  cli/            CLI Click (run-demo, normalize, export, status)
  web/            Flask app + dashboard CRT frontend
  dashboard/      DashboardService (SQLite metrics, history, cache, sessions)
  daemon/         DaemonMonitor (watchdog su incoming + gestionale/responses)
  exporters/      GEDCOM exporter + JSON exporter
  integrations/   GiardinaIntegration + GestionaleIntegration
  utils/          config loader (YAML + env)
```

## Cartelle dati runtime

```
data/incoming/              GEDCOM in ingresso (daemon watch)
data/normalized/            GEDCOM normalizzati + _audit.json + _status.json
data/gestionale/pending/    batch JSON in attesa approvazione
data/gestionale/responses/  risposte gestionale (approve/reject)
data/gestionale/archive/    job processati
data/dashboard/             metrics.sqlite3 + targets.json + exports/
```

## Workflow contribuzione

1. Fork + branch `feature/<nome>`
2. Sviluppa con test (`pytest tests/ -v`)
3. PR verso `develop`
4. Review + merge → `develop`
5. Release: `develop` → `main` + tag `vX.Y.Z`

## Debug comune

| Problema | Soluzione |
|---|---|
| `ModuleNotFoundError` | Attivare venv + `pip install -r requirements.txt` |
| `data/dashboard/metrics.sqlite3` mancante | Eseguire init DB sopra |
| `watchdog` non disponibile | `pip install watchdog` |
| Port 5000/8000 occupata | Modificare porta in `config/default.yaml` |
