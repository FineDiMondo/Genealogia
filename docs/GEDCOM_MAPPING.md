# GEDCOM MAPPING - Versione 0

## Entita principali

- `INDI` -> `PERSON`
- `FAM` -> `FAMILY` + collegamenti parentali
- `SOUR` -> `SOURCE`
- citazioni individuo/famiglia -> `CITATION`

## Eventi

- `BIRT` -> nascita
- `DEAT` -> morte
- `MARR` -> matrimonio
- supporto date approssimate e intervalli (`ABT`, `FROM ... TO ...`)

## Calendari e date

- supporto marker calendario (es. julian)
- normalizzazione date in fase S3

## Pipeline applicativa

1. Tokenizzazione record GEDCOM
2. Mapping in record interni
3. Normalizzazione
4. Rilevamento conflitti
5. Revisione/accettazione
6. Write in DB
7. Batch post-write

## Vincolo V0

Ogni record processato deve essere tracciato in `IMPORT_LOG`.
