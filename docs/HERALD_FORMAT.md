# HERALD FORMAT - Versione 0

## Input CSV atteso

Colonne minime consigliate:

- `house_id`
- `house_name`
- `blazon_ita`
- `blazon_lat`
- `svg_filename`
- `origin_region`
- `founded_date`
- `noble_rank`
- `realm`
- `notes`

## Mapping output

- `HOUSE`
- `HERALD`
- `MEDIA` (se file vettoriale disponibile)

## Esecuzione shell

- comando: `import herald`
- prerequisito: DB in stato READY
