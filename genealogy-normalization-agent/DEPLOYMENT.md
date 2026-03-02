# Deployment Guide

## Prerequisiti

- Python 3.10+
- Docker + Docker Compose (per deploy containerizzato)
- Variabili d'ambiente configurate (vedere `.env.example`)

## Variabili d'ambiente

| Variabile | Default | Descrizione |
|---|---|---|
| `NORMALIZATION_API_KEY` | — | Chiave API Anthropic (opzionale, se si usa Claude) |
| `DASHBOARD_DB_PATH` | `data/dashboard/metrics.sqlite3` | Path SQLite |
| `DASHBOARD_TARGETS_PATH` | `data/dashboard/targets.json` | Target per dominio |
| `LOG_LEVEL` | `INFO` | Livello log |

## Deploy locale (Python)

```bash
cd genealogy-normalization-agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Inizializza DB
python -c "from src.dashboard.service import DashboardService; DashboardService()"

# Avvia servizi
python -m src.api.server &    # API su :8000
python -m src.web.app &       # Web + Dashboard su :5000
python -m src.daemon.monitor \
  --incoming data/incoming \
  --normalized data/normalized \
  --gest-pending data/gestionale/pending \
  --gest-responses data/gestionale/responses \
  --gest-archive data/gestionale/archive &
```

## Deploy Docker

```bash
cp .env.example .env          # configurare variabili
docker compose up --build -d
docker compose logs -f        # monitoraggio
```

## Health check

```bash
# API health
curl http://localhost:8000/api/v1/health
# Atteso: {"status":"healthy"}

# Dashboard metrics
curl http://localhost:8000/api/v1/dashboard/metrics

# Swagger docs
open http://localhost:8000/docs
```

## Checklist produzione

- [ ] `.env` configurato con chiavi reali
- [ ] DB inizializzato (`metrics.sqlite3` esiste)
- [ ] `data/` directories create (`incoming`, `normalized`, `gestionale/*`, `dashboard`)
- [ ] Porte 5000/8000 libere o proxy configurato
- [ ] Test passano (`pytest tests/ -q`)
- [ ] Log monitorati

## Aggiornamento

```bash
git pull origin main
pip install -r requirements.txt   # se dipendenze cambiate
# Riavviare i servizi
```

## Troubleshooting

| Sintomo | Causa | Soluzione |
|---|---|---|
| API non risponde su :8000 | Server non avviato | `python -m src.api.server` |
| Dashboard vuota | SQLite non inizializzato | Init DB (vedi Development.md) |
| Daemon non processa file | Directory `incoming` mancante | `mkdir -p data/incoming` |
| Docker build fallisce | Dipendenze mancanti | `pip install -r requirements.txt` nel container |

## Monitoring

- Log daemon: stdout/stderr del processo
- Metriche: `GET /api/v1/dashboard/metrics`
- Dashboard visuale: `http://localhost:5000/dashboard`
- Export storico: `GET /api/v1/dashboard/export?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
