# Installation

## Requirements
- Python 3.10+
- pip + virtual environment support
- UTF-8 filesystem

## Setup
```bash
cd genealogy-normalization-agent
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Windows PowerShell:
```powershell
cd genealogy-normalization-agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Verify
```bash
python -m src.cli.cli run-demo
python -m src.api.server
pytest -q
```

## Production config
- Base config: `config/default.yaml`
- Production: `config/production.yaml`
- Override valori sensibili via `.env` (`NORMALIZATION_API_KEY`, `DATABASE_URL`, `DB_*`)
