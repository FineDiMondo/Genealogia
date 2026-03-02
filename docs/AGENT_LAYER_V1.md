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