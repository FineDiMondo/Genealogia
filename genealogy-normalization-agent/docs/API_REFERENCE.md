# API Reference

This file mirrors the runtime OpenAPI surface from `src/api/server.py`.

## Runtime docs
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

## Endpoints snapshot
- `GET /health`
- `POST /normalize`
- `POST /normalize/batch`
- `POST /duplicates`
- `POST /integrations/giardina/process`
- `POST /integrations/gestionale/export`

## Export static OpenAPI
```bash
python - <<'PY'
from src.api.server import app
import json
from pathlib import Path
Path("docs/openapi.json").write_text(json.dumps(app.openapi(), indent=2), encoding="utf-8")
print("written docs/openapi.json")
PY
```
