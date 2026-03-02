# PIANO TEST GN370 v2.0

## Invarianti
- TEST_BOOT_NO_DATA_FETCH
- TEST_BOOT_DB_EMPTY
- TEST_BOOT_CTX_NULL
- TEST_STATE_TRANSITIONS
- TEST_GATE_BLOCKS_QUERY
- TEST_GATE_BLOCKS_FETCH
- TEST_EXPORT_FILENAME_REGEX
- TEST_RESET_IDEMPOTENT

## Import
- GEDCOM 5.5.1/7.0
- CSV araldico
- XML notarile
- JSON nobiltà

## Multi-env
- switch dev/test/prod
- update .env e ersion.json
"@ | Set-Content -Encoding UTF8 docs/PIANO_TEST.md

@"
# RUNBOOK GN370

1. Setup ambiente:
   - ash environments/setup-env.sh dev|test|prod
2. Verifica struttura:
   - ash scripts/verify_deployment.sh
3. Verifica boot:
   - ash scripts/verify_boot.sh
4. Avvio locale:
   - python -m http.server 8080
5. Test automatici:
   - 
pm test
"@ | Set-Content -Encoding UTF8 docs/RUNBOOK.md

@"
# LEXICON GN370

- DB.status: EMPTY | READY | ERROR.
- Gate: blocco pre-esecuzione su operazioni dati.
- CTX: contesto sessione runtime.
- JOURNAL: append-only log.
- Copybook: schema COBOL canonico.
- AAAAGGMMHHMM: formato timestamp commit zip.
