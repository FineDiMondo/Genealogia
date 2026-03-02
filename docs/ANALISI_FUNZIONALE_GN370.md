# Analisi Funzionale GN370

## Scopo
GN370 e un sistema genealogico a interazione 370 (CLI/terminal) che gestisce entita, relazioni ed eventi con tracciabilita completa (journal). L'utente opera tramite transazioni testuali.

## Perimetro
Incluso:
- Consultazione (FEED, OPEN, SHOW)
- Ricerca (FIND)
- Processi (JOB: import/normalize/validate/journal)
- Spiegazione algoritmica (EXPLAIN)
- Stato sistema (SYSTEM)

Escluso:
- UI grafica moderna
- Editing massivo da web (solo consultazione su Pages)
- PWA/offline (decommissionato)

## Attori
- Utente operatore (naviga, cerca, consulta, avvia job locali)
- Sistema agent layer (parse/norm/valid/expl)
- Pipeline runner (job sequenziale)
- Storage (file/journal e/o DB relazionale locale)

## Concetti di dominio
- Persona: nodo principale (identita, attributi vitali)
- Relazione: legame normalizzato tra entita
- Evento: fatto datato e localizzato
- Fonte: riferimento documentale
- Journal: log append-only delle transazioni/eventi

## Interazione Uomo-Macchina
Principi:
- Unica command line
- Output come buffer storico
- Suggerimenti contestuali
- Banner tecnico sempre visibile (tech/algo/agent/source)
- Errori con recovery (suggestions)

## Schermate (Livello 1)
- MAIN: stato generale e accesso rapido
- FEED: journal transazioni
- PERSON: scheda persona (essenziale)
- REL: scheda relazione (join esplicito)
- JOB: pipeline e progress
- EXPLAIN: trasparenza algoritmica
- SYSTEM: build/data/cache/dataset

## Comandi (sintesi)
Riferimento dettagliato: `docs/GN370_COMMANDS.md`

## Requisiti Funzionali
RF-001: Visualizzare FEED ultimi N eventi
RF-002: Aprire una PERSON per ID e mostrare card
RF-003: Aprire una REL e verificare integrita referenziale
RF-004: Avviare JOB locali (pipeline) e mostrare progress
RF-005: Fornire EXPLAIN coerente con l'azione eseguita
RF-006: Suggerimenti contestuali (max 8, ordinati)

## Requisiti Non Funzionali
RNF-001: Modalita web (Pages) read-only
RNF-002: Modalita local/launcher full (job + write)
RNF-003: Robustezza errori: nessun crash non gestito
RNF-004: Tracciabilita: ogni azione produce log/journal
RNF-005: Coerenza: modellazione normalizzata (3NF o equivalente)

## Open Points
- Migrazione completa a DB relazionale (schema definitivo)
- Politiche di dedup e merge
- Cifratura/backup dataset (privacy)
