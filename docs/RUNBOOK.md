# RUNBOOK GN370 v0.1

## Obiettivo
Esecuzione operativa end-to-end del sistema GN370 su stack statico 370.

## Flusso ufficiale
`GEDCOM -> Batch -> out/current -> static 370 -> GitHub Pages`

## Prerequisiti
- Python 3.12+
- Ambiente locale con repository aggiornato su `main`
- Dati in `data/current/` disponibili o generabili dalla pipeline locale

## 1. Verifica rapida piattaforma
```powershell
git checkout main
git pull origin main
python tests/schema/test_migration_002.py
python tests/schema/test_integrity_triggers.py
python tests/schema/test_transaction_manager.py
python tests/agents/test_message_bus_contracts.py
python tests/agents/test_parse_norm_agents.py
python tests/agents/test_valid_expl_agents.py
python tests/agents/test_agent_pipeline_integration.py
python tests/agents/test_cli_parser.py
python tests/agents/test_suggest.py
python tests/agents/test_shell_runner_smoke.py
```

## 2. Esecuzione shell web 370 (read-only)
- Aprire `index.html` o la root pubblicata su Pages.
- Comandi minimi:
  - `help`
  - `feed last 10`
  - `open person <id>`
  - `show card`
  - `explain`

## 3. Pipeline/import locale
- Eseguire la pipeline agent locale tramite runner Python (launcher/reference implementation).
- Verificare output su `event_journal` e coerenza hash chain con test schema.

## 4. Gestione conflitti e explain
- Individuare conflitti in `conflict_log`.
- Usare `explain` per tracciare derivazione e fonte del dato.

## 5. Backup/restore operativo
- Procedure e script nel documento dedicato: `docs/DB_LIFECYCLE.md`.

## 6. Deploy GitHub Pages
- Push su `main`.
- Workflow atteso: `.github/workflows/pages-static.yml`.
- Radice deploy (priorita'):
  1. `PORTALE_GN/`
  2. `out/current/site/`

## 7. Validazione post-deploy
```bash
./verify_deployment.sh
```
Controllare inoltre la homepage pubblica:
- layout 370 presente
- assenza riferimenti a runtime legacy

## 8. Incident response minima
Se Pages non aggiorna:
1. Verificare in repository settings che la source sia `GitHub Actions`.
2. Rerun di `pages-static`.
3. Triggerare un nuovo deploy con commit tecnico minimo (es. update `version.json`).
