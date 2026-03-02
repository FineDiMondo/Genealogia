# GEDCOM Sync Orchestrator

Sincronizzazione GEDCOM giornaliera (Ancestry + FamilySearch) con merge, versionamento Git e notifica email.

## File principali

- `gedcom_sync_orchestrator.py`
- `config.yaml`
- `.env.example`
- `requirements.txt`
- `setup.sh`
- `setup_cron.sh`
- `Dockerfile`
- `docker-compose.yml`

## Setup rapido

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Directory:

```text
genealogy/gedcom/
├── ancestry/
├── familysearch/
├── merged/
└── archive/
logs/
```

## Configurazione

Compila `.env` con:

- `GITHUB_TOKEN`
- `ANCESTRY_USERNAME` / `ANCESTRY_PASSWORD`
- `FAMILYSEARCH_USERNAME` / `FAMILYSEARCH_PASSWORD`
- `SMTP_USER` / `SMTP_PASSWORD`
- `REPO_PATH`

Suggerito per run deterministico:

- `ANCESTRY_GEDCOM_PATH`
- `FAMILYSEARCH_GEDCOM_PATH`

In `config.yaml`:

- schedule `08:00`
- `frequency: daily`
- `timezone: Europe/Rome`
- `merge.strategy: ancestry_priority`
- `notifications.email: daniel.giardina@gmail.com`

## Test run

```bash
python gedcom_sync_orchestrator.py --run-once
```

Verifica:

- file in `genealogy/gedcom/merged/`
- log in `logs/sync_*.log`
- commit git (se ci sono modifiche)

## Scheduler

Cron:

```bash
bash setup_cron.sh
crontab -l
```

Docker:

```bash
docker build -t gedcom-sync:latest .
docker-compose up -d
docker-compose logs -f gedcom-sync
```

## Note importanti

- `.env` non va committato.
- questa versione usa import GEDCOM da path locali (tramite env var) per stabilità.
- le credenziali Ancestry/FamilySearch sono predisposte a livello config/env, ma l’estrazione diretta via web va implementata con connettori ufficiali.

