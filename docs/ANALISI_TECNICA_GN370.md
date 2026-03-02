# Analisi Tecnica GN370

## Obiettivo tecnico
Implementare una shell 370 + agent layer con pipeline batch e tracciabilita (journal), garantendo normalizzazione e trasparenza algoritmica.

## Architettura a layer
- UI 370 (web static e/o launcher)
- Command parsing + suggestion
- Agent layer (parse/norm/valid/expl)
- Pipeline runner (sequenziale)
- Storage:
  - Journal NDJSON (append-only)
  - Entity store (file record singolo / NDJSON)
  - Indici (file sequenziali)
  - Opzionale: DB relazionale locale (SQLite) per integrita e query

## Componenti agent (baseline)
- `message_bus.py`: bus messaggi
- `contracts.py`: contratti payload
- `parse_agent.py`: parsing/import
- `norm_agent.py`: normalizzazione
- `valid_agent.py`: validazione
- `expl_agent.py`: spiegazione
- `pipeline_runner.py`: orchestrazione IMPORT->NORMALIZE->VALIDATE->JOURNAL

## Shell/CLI (baseline)
- `cli_parser.py`: parsing comandi formale
- `suggest.py`: suggestion engine
- `shell_runner.py`: sessione CLI con contesto e history

## Dati e normalizzazione
Principi:
- Separare entita, relazioni, eventi
- Minimizzare ridondanza (3NF mental model)
- ID stabili (policy definita)
- Journal append-only come fonte storica

## Trasparenza algoritmica
Ogni screen deve esporre:
- TECH: tecnologia attiva
- ALGO: algoritmo dominante
- AGENT: agente responsabile
- SOURCE: dataset/journal/store
- INTEGRITY: stato vincoli (quando applicabile)

## Modalita esecuzione
- Web (GitHub Pages): read-only, fetch di file statici
- Local (Windows/launcher): esegue job e scrive output

## Logging e error handling
- Errori in forma: `(ERR CODE)` + hint + suggestions
- Warning: `(WRN)` con impatto
- Log tecnico separato dal journal user-facing (quando utile)

## Performance
- Operazioni sequenziali su record (single record per file)
- Indici minimali per lookup (id->path, name->id)
- Evitare dipendenze runtime pesanti (no node in prod)

## Open Points tecnici
- Bridge web<->local (`session_state.json`)
- Schema relazionale definitivo + migrazioni
- Strategie cache/version (`version.json`)
