# ANALISI REQUISITI GN370 v2.0

## Requisiti chiave
- Boot deterministico: DB.status=EMPTY, CTX nullo, zero fetch dati.
- Import da user gesture: ZIP, GEDCOM, CSV araldico, XML notarile, JSON nobiltà.
- Gate obbligatorio: query/fetch dati bloccati se DB non READY.
- Copybook COBOL come fonte di verità schema.
- Export commit in formato AAAAGGMMHHMM.zip.
- Multi-env DEV/TEST/PROD con switch script.
- Runtime client-side, deploy static GitHub Pages.
