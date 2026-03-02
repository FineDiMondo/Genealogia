# GN370 Events (NDJSON)

Formato: un JSON per riga.

Campi minimi obbligatori:
- `ts`: timestamp ISO UTC (es. `2026-03-02T09:46:29Z`)
- `type`: tipo evento (es. `person.updated`)
- `entity`: `person` | `family` | `story`
- `id`: identificativo entita'
- `title`: descrizione breve

Esempio riga:
`{"ts":"2026-03-02T10:00:00Z","type":"person.updated","entity":"person","id":"P0001001","title":"Update cognome da fonte notarile"}`

Regole di generazione:
- UTC sempre consigliato.
- Un evento per riga, senza array globale.
- Naming `type` in minuscolo e dot-separated.
- `title` breve (<= 120 chars).
- No campi binari/voluminosi nel journal.

Type consigliati (MVP):
- `source.added`
- `person.updated`
- `relation.confirmed`
- `family.linked`
- `story.published`
- `person.merged`
