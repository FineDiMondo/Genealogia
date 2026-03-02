# Genealogia

Repository GN370 orientato a output statico 370.

Pipeline attiva:
`GEDCOM -> Batch -> out/current -> static 370 -> GitHub Pages`

## Deploy GitHub Pages

Workflow attivo:
- `.github/workflows/pages-static.yml`

Root statica pubblicata (in ordine di priorita):
1. `PORTALE_GN/`
2. `out/current/site/`

Se nessuna root esiste, il deploy fallisce intenzionalmente.

## Componenti fuori deploy

- launcher nativo SDL2 (`launcher/`)
- tool locali (`tools/db`, `tools/rootsmagic`, ecc.)
- contenuti legacy congelati in `legacy/`

## Verifica deploy

Script:
- `verify_deployment.sh`

Controlli principali:
- homepage statica 370 presente
- `version.json` presente
- assenza riferimenti attivi a `app/`, `pages-astro`, `manifest.webmanifest`, `dist/`

## Build & Test locali

Build COBOL:
```powershell
.\cobol\build.ps1
```

Test Python core:
```powershell
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

## Governance

- Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)
- Definition of Done: [docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md)
- Lexicon: [docs/LEXICON.md](docs/LEXICON.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)