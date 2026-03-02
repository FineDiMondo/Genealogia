# ROADMAP GN370-NEXT

Versione roadmap: 0.1.0
Data: 2026-03-02
Owner: GN370 team

## Scope v0.1 (in)
- Data layer normalizzato con migrazioni versionate.
- Integrita' avanzata (trigger polimorfici + reliability gate).
- Transaction manager unico con journal hash-chain.
- Agent layer v1: PARSE, NORM, VALID, EXPL.
- Shell semantica con grammar formale e footer stato permanente.
- CI quality gate su schema, agenti, UI comandi principali.

## Out of scope v0.1 (out)
- Ottimizzazioni prestazionali non bloccanti.
- Connettori esterni completi (FamilySearch/Ancestry full).
- Inferenza AI in scrittura automatica.
- UI grafica ad albero avanzata.

## Fasi e checkpoint
1. Fase 0: baseline governance (docs + PR template).
2. Fase 1: migrazione 002 (schema dominio + indici + seed lexicon).
3. Fase 2: trigger integrita' avanzata.
4. Fase 3: transaction manager + journal replay base.
5. Fase 4: agent layer v1 e pipeline import->normalize->validate->journal.
6. Fase 5: shell semantica + UX 370 completa.
7. Fase 6: CI quality gate + regressione.
8. Fase 7: release v0.1 + runbook + changelog.

## Backlog tecnico prioritizzato
P0
- Definire e testare schema 3NF target in migrazione incrementale.
- Imporre integrita' su subject polimorfico (`event`, `heraldic_arm`).
- Centralizzare tutte le write nel transaction manager.
- Garantire coerenza hash chain `event_journal`.

P1
- Parser comandi LL(1) con suggerimenti orientativi su errore.
- Footer stato coerente con metriche reali DB/agent.
- EXPLAIN LAST tracciabile fino a journal/source.
- Test end-to-end import GEDCOM ambiguo con conflict_log.

P2
- Ottimizzazione indici query frequenti.
- Metriche estese quality report (trend warning/error).
- Hardening UX su casi limite history/autocomplete.
- Ridondanza dichiarativa tabelle `source`/`schema_version`/`lexicon` tra 001 e 002: consolidare in migrazione 003+ con home unica per create e `ALTER TABLE` per evoluzioni.

## Rischi principali e mitigazioni
- Rischio: mismatch tra LEXICON e seed DB.
  Mitigazione: test automatico di allineamento docs->seed.
- Rischio: bypass write dirette DB.
  Mitigazione: repository gateway + test statici/integrati.
- Rischio: regressioni UI shell.
  Mitigazione: test regressione comandi core in CI.

## Criterio di avanzamento tra fasi
- Ogni fase richiede: STOP -> PUSH -> GATE approvato.
- Nessuna fase N+1 parte senza gate N approvato.

## Stato documenti esistenti in docs/
I seguenti file erano presenti prima della Fase 0 e verranno riconciliati col LEXICON durante la Fase 1:
- `GN370_SHELL.md` - spec shell (da allineare a grammar v0.1).
- `GN370_EVENTS.md` - spec eventi (da allineare a `EVENT_TYPE` lexicon).
- `GN370_STORIES.md` - spec storyteller (da allineare a `STORY_AGT`).
- `EVENT_JOURNAL.md` - spec journal (da allineare a TM Fase 3).
- `GEDCOM_MAPPING.md` - mapping GEDCOM->schema (da verificare in Fase 1).
- `DB_LIFECYCLE.md` - lifecycle backup/restore (da allineare a Fase 3).
- `ROOTSMAGIC_ADAPTER.md` - adapter esterno (in scope fase futura).

## Indici rinviati a migrazione 003
- `idx_journal_entity` su `event_journal(entity_type, entity_id)`.
- `idx_journal_agent` su `event_journal(agent_id, occurred_at)`.
- `idx_journal_sess` su `event_journal(session_id)`.
- `idx_conflict_open` su `conflict_log(status)` con filtro `status='OPEN'`.

Nota implementativa G1-A: e' stata adottata l'Opzione A, con `001_gn370_next_core.sql` tracciato nel repository come prerequisito esplicito della 002.
