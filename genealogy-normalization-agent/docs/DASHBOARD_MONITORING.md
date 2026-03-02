# Dashboard Monitoring System

## Scope
- Real-time counters by domain
- Normalization status and quality
- Source lineage
- Processing timeline
- Reuse/cache analytics
- Historical export (JSON/CSV)

## URLs
- Web dashboard (Flask): `http://127.0.0.1:5000/dashboard`
- API metrics (FastAPI): `http://127.0.0.1:8000/api/v1/dashboard/metrics`

## API endpoints
- `GET /api/v1/dashboard/metrics`
- `GET /api/v1/dashboard/sources`
- `GET /api/v1/dashboard/timeline`
- `GET /api/v1/dashboard/reuse`
- `GET /api/v1/dashboard/quality`
- `POST /api/v1/dashboard/history`

## Persistence
- Storage engine: SQLite (`data/dashboard/metrics.sqlite3`)
- Domain targets: `data/dashboard/targets.json`
- Exports: `data/dashboard/exports/`

## Data flow
1. Normalization run (API/Web/Daemon/GIARDINA) generates `NormalizedPerson`.
2. `DashboardService.record_normalization_batch(...)` persists history + metrics.
3. Dashboard endpoints aggregate and return live statistics.
4. UI refreshes every 30 seconds.

## SQLite schema summary
Tables are created automatically:
- `normalization_metrics`
- `normalization_history`
- `normalization_cache`
- `normalization_sessions`

## Notes
- The dashboard is file-based and does not require external DB services.
- If you need custom totals per domain, edit `data/dashboard/targets.json`.
