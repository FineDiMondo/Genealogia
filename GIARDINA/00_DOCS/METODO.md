# Metodo Operativo - Portale Giardina

## Pipeline batch

1. INGEST: `02_DATA/RAW` -> `02_DATA/CURATED`
2. NORMALIZE: naming canonico e media catalog
3. VALIDATE: schema COPY + referenze + media
4. INDEX: search index + schema compilati
5. PUBLISH: sito statico in `05_OUT/site`

## Classi di attendibilità

- `DOCUMENTATO`: fonte primaria tracciata
- `STAMPA`: fonte a stampa
- `ATTRIBUITO`: attribuzione non primaria
- `RICOSTRUITO`: ricostruzione tecnica

## Regole di integrità

- Ogni record deve avere `id`, `type`, `date.sort`, `date.display`, `place_id`, `reliability`.
- `date.sort` sempre ISO `YYYY-MM-DD`.
- Tutti i riferimenti (`*_ids`) devono puntare a record esistenti.
- Record `DOCUMENTATO` senza `source_ids` genera warning.
- Stemmi `ATTRIBUITO` senza fonte generano warning dedicato.

