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
4. Normalizzazione AI-assisted per `family_key` usando storico `IMPORT_LOG_FAMILY`
5. Rilevamento conflitti
6. Revisione/accettazione
7. Write in DB
8. Batch post-write

## Vincolo V0

Ogni record processato deve essere tracciato in `IMPORT_LOG`.
Ogni record processato deve essere tracciato anche in `IMPORT_LOG_FAMILY` con `family_key` e `log_ts`.
