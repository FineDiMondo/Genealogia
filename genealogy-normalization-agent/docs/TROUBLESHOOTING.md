# Troubleshooting

## `python` not found
Install Python 3.10+ and ensure it is in PATH.

## `ModuleNotFoundError: src`
Run commands from `genealogy-normalization-agent` root.

## GEDCOM not processed
- Verify file extension `.ged`
- Verify daemon watches the correct `--incoming` path
- Check `data/normalized/*_status.json` for errors

## Gestionale response ignored
- Confirm file is in `data/gestionale/responses/<job_id>.json`
- Ensure payload contains `approvals` key

## Empty output
- Check input GEDCOM contains `INDI` records
- Validate parser assumptions in `giardina_integration.py`

