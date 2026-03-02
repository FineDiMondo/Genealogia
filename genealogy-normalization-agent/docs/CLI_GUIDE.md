# CLI Guide

Entry point: `python -m src.cli.cli`

## Commands
- `run-demo`
- `normalize-file <input.json> [--source cli]`
- `detect-duplicates <input.json> [--threshold 0.92]`
- `export <input.json> --format json|gedcom --output <path>`
- `process-gedcom <filename> [--incoming-dir ... --output-dir ...]`
- `export-gestionale <input.json> --job-id JOB-... [--pending-dir ...]`

## Example
```bash
python -m src.cli.cli process-gedcom latest.ged --incoming-dir data/incoming --output-dir data/normalized
```

