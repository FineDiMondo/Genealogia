# Metodo Portale Giardina

## Principi

- Archivio file-based, versionabile, deterministico.
- Un record per file YAML in `03_records/`.
- Nessun database obbligatorio.
- Tracciabilità: ogni record include fonti, attendibilità e media.

## Attendibilità

- `DOCUMENTATO`: prova primaria (atto notarile, registro originale).
- `STAMPA`: fonte a stampa storica da verificare criticamente.
- `ATTRIBUITO`: assegnazione non primaria.
- `RICOSTRUITO`: output tecnico/artistico ricostruito.
- `TRADIZIONE`: informazione non verificata.

## Araldica

- Gli stemmi sono record `type: stemma`.
- Il campo `status` deve essere uno tra:
  - `DOCUMENTATO`
  - `ATTRIBUITO`
  - `RICOSTRUITO`
- Non mescolare stati nella stessa scheda.

## Regole dati

- `id` canonico: `YYYY-MM-DD__tipo__soggetti__luogo__slug`.
- `date.sort`: `YYYY` o `YYYY-MM` o `YYYY-MM-DD`.
- `date.display`: forma umana.
- Link espliciti in `links.families|people|sources|heraldry`.
- Media sempre in `02_curated/` con naming coerente.

