# API Operations

Base app: `src/api/server.py` (FastAPI).

## Endpoints
- `GET /health`
- `POST /normalize`
- `POST /normalize/batch`
- `POST /duplicates`
- `POST /integrations/giardina/process?filename=<file.ged>`
- `POST /integrations/gestionale/export?job_id=<JOB-ID>`
- `GET /api/v1/dashboard/metrics`
- `GET /api/v1/dashboard/sources`
- `GET /api/v1/dashboard/timeline`
- `GET /api/v1/dashboard/reuse`
- `GET /api/v1/dashboard/quality`
- `POST /api/v1/dashboard/history`

## Example normalize
```bash
curl -X POST http://127.0.0.1:8000/normalize \
  -H "Content-Type: application/json" \
  -d '{"person_id":"P1","given_names":"PIETRO","family_name":"dagostino"}'
```

## Errors
- `404` missing input file (integration endpoint)
- `422` payload validation errors
- `500` unexpected runtime errors

## Esempio export gestionale
```bash
curl -X POST "http://127.0.0.1:8000/integrations/gestionale/export?job_id=JOB-TEST-001" \
  -H "Content-Type: application/json" \
  -d '{"source":"api","records":[{"person_id":"P1","given_names":"PIETRO","family_name":"d\'agostino"}]}'
```
