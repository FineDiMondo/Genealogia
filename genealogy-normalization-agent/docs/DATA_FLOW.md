# Data Flow

## End-to-end
```text
/data/incoming/*.ged
  -> GiardinaIntegration.read_gedcom
  -> DataNormalizationEngine.normalize_batch
  -> /data/normalized/<file>.ged
  -> /data/normalized/<file>_audit.json
  -> /data/normalized/<file>_status.json
  -> /data/gestionale/pending/<job_id>.json
  -> (user review in gestionale)
  -> /data/gestionale/responses/<job_id>.json
  -> apply_user_decisions + archive
```

## Directories
- `data/incoming`
- `data/normalized`
- `data/gestionale/pending`
- `data/gestionale/responses`
- `data/gestionale/archive`

