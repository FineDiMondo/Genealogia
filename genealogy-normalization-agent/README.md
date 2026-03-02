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

Daemon:

```bash
python -m src.daemon.monitor --incoming data/incoming --output data/normalized
```

## Struttura

- `src/agent`: engine, modelli, quality control
- `src/rules`: regole di normalizzazione
- `src/api`: endpoint FastAPI
- `src/cli`: comandi CLI
- `src/web`: mini interfaccia Flask
- `src/daemon`: monitor cartelle
- `src/exporters`: export JSON/GEDCOM
- `tests`: test automatici base

