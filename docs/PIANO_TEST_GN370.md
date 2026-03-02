# Piano Test GN370

## Scopo
Garantire non regressione e comportamento deterministico di parser, suggestion, shell, agent e pipeline.

## Ambiti
- Unit test Python: agent contracts, bus, agent, pipeline
- Unit test CLI: parser comandi, suggest
- Smoke CLI: shell runner
- Smoke web: caricamento UI e comandi base (se presente `ui_smoke`)

## Suite obbligatorie (baseline)
Python:
- `tests/agents/test_message_bus_contracts.py`
- `tests/agents/test_parse_norm_agents.py`
- `tests/agents/test_valid_expl_agents.py`
- `tests/agents/test_agent_pipeline_integration.py`
- `tests/agents/test_cli_parser.py`
- `tests/agents/test_suggest.py`
- `tests/agents/test_shell_runner_smoke.py`

JS (legacy):
- `npm --prefix legacy run test:all`

## Casi di test funzionali minimi
CT-001: help stampa comandi e non crasha
CT-002: feed /last 10 gestisce journal vuoto
CT-003: open person <id> imposta contesto
CT-004: show card produce output coerente
CT-005: comando errato produce (ERR) + suggestions utili
CT-006: explain produce banner e spiegazione coerente

## Test di regressione deploy (Pages)
- `verify_deployment.sh` deve passare
- Nessun riferimento a runtime legacy nelle pagine pubblicate

## Definition of Done (test)
- Tutti i test passano in CI
- Nessun crash non gestito in smoke
- Output deterministico su fixture
