# Agent Layer v1 (Phase 4a)

Questo documento descrive il perimetro della fase 4a: contratti agent e message bus in-memory.

## Contratti agent
Modulo: `tools/agents/contracts.py`

Interfaccia minima per ogni agent:
- `agent_id`
- `version`
- `subscribes_to[]`
- `publishes_to[]`
- `process(message) -> result` (Protocol)

Registry v1:
- `PARSE_AGT`
- `NORM_AGT`
- `VALID_AGT`
- `STORY_AGT`
- `SYNC_AGT`
- `EXPL_AGT`
- `INFER_AGT`

## Message bus
Modulo: `tools/agents/message_bus.py`

Semantica:
- `publish(topic, payload)` su bus in-memory
- `subscribe(topic, handler)`
- publish su topic senza subscriber: comportamento silenzioso (`delivered=0`)
- payload malformato: errore controllato `MalformedMessageError`

## Limiti della fase 4a
- Nessuna logica agent implementata
- Nessuna write DB dagli agent
- Nessun wiring TM/agent runtime

## Test
`tests/agents/test_message_bus_contracts.py`
- publish senza subscriber
- subscriber in attesa finche non arriva publish
- payload malformato con errore controllato
- validazione contract registry

## Fase 4b (implementazione iniziale agent)
Moduli:
- `tools/agents/parse_agent.py`
- `tools/agents/norm_agent.py`

Scope 4b:
- `PARSE_AGT`: parsing GEDCOM deterministico con errori posizionali.
- `NORM_AGT`: mapping in operazioni normalizzate + dedup/conflict detection.
- Nessuna write DB diretta: output su topic bus (`norm.completed`, `norm.conflict`).

Test:
- `tests/agents/test_parse_norm_agents.py`
  - pipeline parse->norm su GEDCOM valido
  - errore sintattico parse con linea
  - conflitto dedup su nomi ambigui

## Fase 4c (implementazione iniziale agent)
Moduli:
- `tools/agents/valid_agent.py`
- `tools/agents/expl_agent.py`

Scope 4c:
- `VALID_AGT`: controllo cicli genealogici (DFS), range biologici, spacing fratelli.
- `EXPL_AGT`: cattura eventi cross-topic e risposta `EXPLAIN` con traccia dipendenze.
- Nessuna write DB diretta dagli agent.

Test:
- `tests/agents/test_valid_expl_agents.py`
  - rilevazione ciclo genealogico
  - rilevazione anomalia biologica
  - explain last con dependency trace

## Fase 4 finale (pipeline orchestrata)
Modulo:
- `tools/agents/pipeline_runner.py`

Pipeline:
- `user.request.parse` -> `PARSE_AGT` -> `parse.completed`
- `NORM_AGT` su `parse.completed` -> `norm.completed` / `norm.conflict`
- `VALID_AGT` su `norm.completed` -> `valid.violation` / `valid.clear`
- Persistenza su `event_journal` e `conflict_log` via `TransactionManager` (no write dirette agent)

Caratteristiche:
- Source bootstrap (`INSERT OR IGNORE INTO source`) prima dell'import.
- Journal entry per agent coinvolti (PARSE, NORM, VALID).
- Replay per sessione con validazione hash chain.

Test:
- `tests/agents/test_agent_pipeline_integration.py`
  - import GEDCOM end-to-end
  - verifica agent_id su journal
  - verifica persistenza person e conflict_log
  - explain trace disponibile
