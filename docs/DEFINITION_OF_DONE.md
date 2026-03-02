# Definition of Done (DoD) GN370-NEXT v0.1

Versione DoD: 0.1.0
Data: 2026-03-02

## 1) Schema e migrazioni
- Ogni nuova tabella e' creata via migration numerata (`NNN_*.sql`).
- Migrazioni eseguibili su DB pulito senza errori.
- Vincoli `CHECK`, `FK`, `UNIQUE` testati con casi positivi e negativi.
- Nessuna colonna derivata non necessaria nel modello core.
- `schema_version` aggiornata e coerente con migration applicata.

## 2) Integrita' e journal
- Trigger polimorfici bloccano riferimenti `subject_id` invalidi.
- Trigger reliability blocca upgrade a `VERIFIED` senza `source_id` valido.
- Ogni mutazione scrive 1 entry su `event_journal` con hash coerente.
- Se fallisce il write journal, l'intera transazione va in rollback.

## 3) Agent layer
- Ogni agent dichiara `agent_id`, `version`, topic pub/sub.
- Nessun agent effettua write DB diretta (solo transaction manager).
- Errori agent loggati con tipo, contesto, timestamp.
- Pipeline E2E minima funziona su fixture GEDCOM di test.

## 4) Shell/UI 370
- Comandi in grammar v0.1 riconosciuti senza `UNKNOWN COMMAND`.
- Comando invalido produce suggerimento orientativo deterministico.
- Footer permanente visibile: `DB|AGT|V|W|E|CONF|SYNC|SCHEMA`.
- Header tecnico pannello visibile: `ALG|STATO|AFFID`.
- Navigazione tastiera base (PF keys/frecce history) funzionante.

## 5) Test e CI
- `npm run test:all` verde in locale.
- CI verde su Linux e Windows.
- Suite include: test schema, trigger, agent integration, comandi shell core.
- Ogni bug P0/P1 noto ha test di regressione associato.

## 6) Documentazione
- README aggiornato con stato reale e link ai documenti chiave.
- CHANGELOG aggiornato per ogni release.
- RUNBOOK operativo riproducibile su macchina pulita.
- Nessun TODO nel codice consegnato a gate (solo backlog in ROADMAP).

## 7) Qualita' merge
- PR con checklist DoD compilata.
- Almeno un reviewer tecnico approva.
- Nessun blocker aperto nel gate corrente.