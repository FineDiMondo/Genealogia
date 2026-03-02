# Transaction Manager (Fase 3)

Modulo: `tools/db/transaction_manager.py`

## Scopo
Write-path unico per le mutazioni DB con journaling atomico.

## Invariante critico
Ogni connessione SQLite aperta dal TM registra sempre la funzione SQL `sha256(text)` prima di qualsiasi operazione.

Motivazione:
- il trigger `trg_event_journal_hash_chain_insert` (migrazione 003) usa `sha256(...)`
- senza registrazione funzione, SQLite solleva `no such function: sha256` e blocca le INSERT sul journal

## API

### `TransactionManager.write(entity_type, entity_id, operation, payload, agent_id, session_id, user_cmd)`
Esegue in singola transazione atomica:
1. controllo idempotenza su `event_journal`
2. mutation principale (`operation`)
3. calcolo `entry_hash = SHA256(prev_hash || payload_json)`
4. insert su `event_journal`
5. commit

Se step 4 fallisce, avviene rollback completo anche della mutation principale.

Return:
- `{journal_id, entry_hash, status: 'written'}`
- oppure `{journal_id, entry_hash, status: 'duplicate'}` in caso idempotente

### `TransactionManager.replay(session_id)`
Legge il journal ordinato per `journal_id` e ricostruisce stato deterministico per sessione.

Return:
- `{session_id, entries, chain_valid, state}`

## Operazioni supportate (v1)
- `person.upsert`
- `sql.exec` (supporto tecnico per scenari controllati)

## Test
- `tests/schema/test_transaction_manager.py`
  - idempotenza
  - replay deterministico
  - rollback atomico su errore journal
  - verifica invariante sha256 su connessioni non-TM