# GN370 Stories

Formato file `.story`:
- Scene separate da header `# <titolo scena>`.
- Righe testuali libere sotto ogni scena.
- Sezione finale fonti opzionale (`[FONTI]`).

Esempio minimo:
# Apertura
Testo scena 1

# Sviluppo
Testo scena 2

Rendering in shell:
- `story play <id>` carica `data/current/stories/<id>.story`.
- Parser divide per scene usando `#`.
- Output con separatori testuali 370.

Indice storie:
- `data/current/stories/index.json`
- campi: `id`, `title`, `period`, `tags[]`

Linee guida autore:
- Blocchi brevi e leggibili su terminale.
- Inserire riferimenti fonti in coda.
- Evitare markup avanzato: testo puro.
