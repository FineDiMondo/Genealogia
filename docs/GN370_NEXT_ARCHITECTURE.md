# GN370-NEXT

## Obiettivo
Evolvere GN370 da shell di consultazione a sistema cognitivo trasparente, con tracciabilita' di provenienza, affidabilita' epistemica, audit algoritmico e agenti specializzati.

## Principi vincolanti
- Nessun dato senza `source_id` o marcatura esplicita (`DERIVED`, `INFERRED`, `ESTIMATED`, `CONFLICTED`).
- Nessuna mutazione senza append su `event_journal` (catena hash).
- La UI non contiene business logic: solo presentazione/stato.
- Gli agenti non scrivono direttamente su DB: passano da transaction manager atomico.
- I codici semantici devono esistere in `lexicon`.
- I dati AI restano separati e non entrano nel percorso "verified" senza conferma umana + fonte.

## Layer architetturali
1. Presentation: UI 370, shell comandi, pannelli stato.
2. Interaction: parser comandi strutturato + dispatcher.
3. Agent layer: `PARSE_AGT`, `NORM_AGT`, `VALID_AGT`, `STORY_AGT`, `SYNC_AGT`, `EXPL_AGT`.
4. Domain model: entita' pure (`PERSON`, `FAMILY`, `EVENT`, `SOURCE`, `PLACE`, `TITLE`, `ARM`).
5. Relational DB (3NF+): schema normalizzato, trigger per integrita' polimorfica.
6. Event journal: append-only con hash chain.
7. External connectors: GEDCOM/API esterne con provenance.

## Stato dati e affidabilita'
- Stati: `VERIFIED`, `DERIVED`, `INFERRED`, `ESTIMATED`, `CONFLICTED`.
- Tutte le viste e storie devono mostrare tag di affidabilita' per fatto/campo.
- Header tecnico pannello: `ALG | STATO | AFFID`.

## Schema relazionale target (estratto)
- Tabelle core: `person`, `person_name`, `family`, `family_member`, `event`, `event_type`, `place`, `source`, `title`, `heraldic_arm`.
- Tabelle trasversali: `event_journal`, `conflict_log`, `schema_version`, `lexicon`, `field_mapping`.
- Integrita' polimorfica su `event.subject_id` e `heraldic_arm.subject_id` via trigger.

## Agenti (contratti minimi)
- `PARSE_AGT`: parsing deterministico input raw -> struttura tipizzata.
- `NORM_AGT`: mapping 3NF + dedup + conflitti sotto soglia confidenza.
- `VALID_AGT`: regole business (coerenza temporale, cicli genealogici, plausibilita' biologica).
- `STORY_AGT`: narrativa template-based tracciabile (no testo inventato).
- `SYNC_AGT`: diff e merge da fonti esterne con approvazione.
- `EXPL_AGT`: spiegazione a ritroso da output -> journal -> fonti -> algoritmo.

## Linguaggio comandi
- Sintassi formale (non linguaggio naturale libero).
- Supporto suggerimenti contestuali se comando non valido.
- Comandi chiave: `FIND`, `SHOW`, `COMPARE`, `IMPORT`, `STORY`, `EXPLAIN`, `SYNC`, `RESOLVE`, `VALIDATE`, `DB`.

## AI controllata
- Aggiunta opzionale `INFER_AGT` solo in modalita' suggerimento.
- Nuovo livello separato: `INFERRED-AI`.
- Esclusione default dalle query salvo `INCLUDE=AI`.
- No promozione automatica a `VERIFIED` senza `source_id` valido.

## Piano incrementale consigliato
1. Stabilizzare schema/versioning:
   - introdurre `schema_version`, `lexicon`, `event_journal` hash chain.
2. Portare reliability nel modello:
   - uniformare codici affidabilita' e rendering in UI.
3. Introdurre transaction manager:
   - tutte le mutazioni passano da una coda operazioni journaled.
4. Implementare `EXPLAIN` minimo:
   - tracciare per comando algoritmo + entita' toccate + journal ref.
5. Separare bus interno da persistenza:
   - pub/sub volatile per agenti + journal persistente append-only.
6. Integrare `SYNC_AGT`:
   - pipeline diff/review/apply con conflict log.
7. Integrare `INFER_AGT` con guardrail:
   - solo suggerimenti, mai write diretto.

## Deliverable tecnici da aprire subito
- Migrazione SQL iniziale per `schema_version`, `lexicon`, `event_journal`, `conflict_log`, `field_mapping`.
- Specifica JSON payload eventi journal (contract v1).
- Test di integrita' trigger polimorfici.
- Test di non-regressione su parsing comandi e tagging affidabilita'.
- Schermata footer permanente con metriche: `DB`, `AGT`, `V/W/E`, `CONF`, `SYNC`, `SCHEMA`.
