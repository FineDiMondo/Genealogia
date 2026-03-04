# GN370 - Piano orchestrazione multiutente (bozza v0.1)

## Obiettivo

Definire un modello operativo multiutente per GN370 che abiliti collaborazione su dati genealogici e pipeline GEDCOM senza rompere le invarianti tecniche gia stabilite.

## Invarianti non negoziabili

- Boot deterministico invariato: `DB.status=EMPTY`, nessun fetch automatico.
- Fetch gate inline in `index.html` invariato.
- Batch agents (`S7-*`) eseguiti solo post-write.
- Ogni record processato produce una entry in `IMPORT_LOG`.

## Scenari d'uso prioritari

1. Team di import:
- un operatore lancia `import gedcom --dry-run`;
- un revisore approva i conflitti ad alto impatto;
- un validatore esegue il write finale.

2. Team data stewardship:
- un editor propone correzioni su persone/famiglie;
- un reviewer applica o respinge la modifica;
- un auditor traccia chi ha fatto cosa e quando.

3. Governance famiglia per famiglia:
- workflow e lock isolati per `family_key`;
- due team possono lavorare in parallelo su famiglie diverse.

## Architettura proposta

## Allineamento bozza PDF (2026-03-04)

- Backend condiviso per connessioni concorrenti e stato centralizzato, con opzioni iniziali `PostgreSQL` oppure `SQLite` sincronizzato.
- Sessioni utente isolate (CTX + session ID) gestite lato server.
- Operazioni di import/modifica/cancellazione racchiuse in transazioni atomiche.
- Registro operativo `JOURNAL` per tracciare actor, timestamp e descrizione azione.
- Meccanismo autorizzativo delegabile al modulo workflow avanzato per i casi sensibili.

## Livelli logici

1. Identity & Session:
- autenticazione utente;
- sessioni con scadenza e revoca centralizzata.

2. Authorization Engine:
- RBAC base (ruoli);
- ABAC opzionale (vincoli su `family_key`, tipo record, ambiente).

3. Collaboration Core:
- lock e versionamento record;
- code di approvazione;
- sincronizzazione eventi.

4. Audit & Observability:
- log append-only operativo;
- tracciamento decisioni autorizzative;
- metriche per latenza, conflitti e throughput.

## Componenti dati (proposti)

- `USERS`: anagrafica utenti.
- `ROLES`: ruoli funzionali.
- `PERMISSIONS`: permessi elementari.
- `ROLE_PERMISSIONS`: mappa ruolo -> permesso.
- `USER_ROLE_BINDING`: assegnazioni ruolo (anche temporanee).
- `WORK_ITEMS`: unita di lavoro (record/famiglia/import).
- `WORK_LOCKS`: lock con TTL e heartbeat.
- `RECORD_VERSION`: versione corrente per optimistic concurrency.
- `AUTH_FLOW`: stato workflow autorizzativo.
- `AUDIT_EVENT`: eventi immutabili con timestamp, actor, payload minimale.

## Ruoli e permessi (baseline)

| Ruolo | Permessi principali | Limiti |
|---|---|---|
| Import Operator | `import gedcom`, `import status`, `import log` | nessun `accept` finale senza revisione |
| Reviewer | `import review`, `import conflicts`, decisione su conflitti | no modifica policy |
| Approver | `import accept`, autorizzazione write | no amministrazione utenti |
| Data Steward | modifica record manuali, merge/split | dentro il perimetro assegnato |
| Auditor | accesso read-only a log e audit trail | no write |
| Admin | gestione ruoli, policy, credenziali | no bypass audit |

## Concorrenza e sincronizzazione

## Strategia consigliata

- Optimistic concurrency per edit ordinari:
  - ogni modifica invia `expected_version`;
  - se mismatch, il sistema genera conflitto applicativo.
- Pessimistic lock per write sensibili:
  - lock a granularita `family_key` o record;
  - TTL breve + heartbeat;
  - lock recovery su sessione persa.

## Politiche anti-conflitto

- Priorita a isolamento per `family_key`.
- Merge guidato solo per campi non distruttivi.
- Campi critici (identita, parentela primaria, date evento) richiedono revisione umana se in conflitto.

## Sincronizzazione

- Event stream interno per:
  - cambi stato workflow;
  - lock acquire/release/expire;
  - esiti validazione automatica.
- Read model aggiornato in near-real-time per console e dashboard.

## Persistenza e sincronizzazione client (estensione)

- Cache locale client (eventualmente cifrata) con sync al ritorno online.
- Replica dati parziale tramite log di modifiche.
- Valutazione futura CRDT per ridurre conflitti su editing concorrente.
- Strategia da attivare in fasi successive per non complicare la V0.

## Flussi operativi chiave

1. Import coordinato:
- operatore esegue `import gedcom --dry-run`;
- reviewer valuta `import conflicts`;
- approver autorizza `import accept <corr_id>`;
- sistema esegue S6 write;
- sistema avvia S7 post-write.

2. Correzione record:
- steward apre work item;
- lock applicato su record/famiglia;
- modifica proposta;
- reviewer approva/richiede modifica;
- write con controllo versione.

## Sicurezza operativa

- MFA per ruoli ad alto privilegio.
- Least privilege by default.
- Token sessione a scadenza breve, refresh controllato.
- Rotazione periodica credenziali tecniche.
- Audit immutabile con retention configurabile.

## Roadmap suggerita

1. Fase 1 - Fondazioni:
- tabella ruoli/permessi;
- audit trail minimo;
- lock per `family_key`.

2. Fase 2 - Workflow:
- stati approvativi completi;
- assegnazione reviewer/approver;
- notifiche operative.

3. Fase 3 - Ottimizzazione:
- ABAC per domini genealogici;
- metriche SLA e dashboard conflitti;
- strumenti di merge assistito.

## Questioni aperte

- Scope minimo del lock: record, famiglia o entrambi.
- Durata massima lock e policy di override amministrativo.
- Modello di tenancy: unico archivio con filtri o archivi separati.
- Requisiti legali su retention audit e diritto di rettifica.
- Strategia offline-first vs online-only per client multiutente.
- Scelta architetturale client: shell indipendente con adapter server oppure web app completa.
- Scelta stack API/backend: `Node.js/Express` o `Django`; esposizione `REST` o `GraphQL`.
