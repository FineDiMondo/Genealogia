# Daemon Runbook

Daemon module: `src/daemon/monitor.py`

## Start
```bash
python -m src.daemon.monitor \
  --incoming data/incoming \
  --normalized data/normalized \
  --gest-pending data/gestionale/pending \
  --gest-responses data/gestionale/responses \
  --gest-archive data/gestionale/archive
```

## Behavior
- Monitors GEDCOM input and response files in parallel
- Writes normalized GEDCOM, audit and status files
- Archives processed gestionale jobs

## Stop
- `Ctrl+C` in foreground mode

## Logs
- Audit: `logs/audit.log`
- Job state: `data/gestionale/job_state.json`

