# GN370 Commands (Fase 5a)

Modalita supportata: una sola modalita 370 standard (shell testuale, no modalita alternative).

## Verbi supportati
- `feed`
- `find`
- `open`
- `show`
- `story`
- `job`
- `db`
- `cache`
- `help`
- `back`
- `menu`
- `explain`

Alias:
- `h -> help`
- `b -> back`
- `m -> menu`
- `r -> refresh`
- `q -> quit`

## Sintassi
`verb [args...] [/opt value] [--opt value]`

Esempi:
- `help`
- `feed /last 10`
- `open person "GN-I1"`
- `show card`
- `job run pipeline`
- `explain`

## Error codes parser
- `EMPTY_COMMAND`: comando vuoto.
- `UNKNOWN_VERB`: verbo non riconosciuto.
- `UNBALANCED_QUOTES`: virgolette non bilanciate.
- `INVALID_OPTION`: formato opzione non valido.

Formato errore shell:
`(ERR) <CODE>: <message> | hint: <hint>`

## Suggestion engine
Output massimo 8 suggerimenti ordinati per confidence:
- `suggestion_text`
- `reason`
- `confidence` (0..1)

Regole minime implementate:
- Dopo `open person ...`: `show card`, `show timeline`, `feed /entity person /id ...`
- Dopo errore sintassi: proposte di correzione + `help`
- Completamento fallback verbi disponibili

## Shell runner (5a)
Comandi attivi:
- `help`, `menu`, `back`
- `feed /last N`
- `open`, `show card`, `show timeline`
- `job run pipeline`
- `explain`

Note:
- `find/story/db/cache/refresh/quit` in 5a sono accettati come stub testuali.
- Journal e conflitti passano sempre da pipeline agent + Transaction Manager.