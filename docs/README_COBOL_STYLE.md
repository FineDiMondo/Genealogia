# README_COBOL_STYLE

## Filosofia

Struttura "COBOL su UNIX":

- base dati in file sequenziali `.DAT` (pipe-delimited)
- tracciati documentati in `copy/*.CPY`
- job batch in `proc/*.sh`
- output HTML statico in `PORTALE_GN/`

Niente JSON come base dati.

## Input GEDCOM

File di input:

- `data/import/raw/latest.ged`

Import:

```bash
./proc/import_gedcom.sh
```

Output import:

- `data/PERSONE.DAT`
- `data/FAMIGLIE.DAT`
- `data/FONTI.DAT`
- `data/EVENTI.DAT`
- `data/import/GEDMAP.DAT` (mapping GEDID -> ID sequenziale stabile)
- `logs/duplicates.log` (potenziali duplicati per nome+nascita)

## Araldica avanzata

File:

- `data/araldica/CASATI.DAT`
- `data/araldica/RAMI.DAT`
- `data/araldica/STEMMI.DAT`
- `data/araldica/APPARTENENZE.DAT`
- `data/araldica/ALLIANZE.DAT`

Asset immagini:

- `PORTALE_GN/assets/heraldry/`

### Regole risoluzione stemma (deterministica)

Per ogni persona:

1. Data riferimento:
   - se nascita+morte: midpoint
   - altrimenti nascita
   - altrimenti morte
   - altrimenti vuoto
2. In `APPARTENENZE.DAT`: seleziona appartenenza valida nel range `DAL..AL`.
   - se multiple: scegli `DAL` più recente
3. In `STEMMI.DAT`: filtra per `CASATO+RAMO` e range data.
   - scegli `PRIORITA` più alta
4. Fallback:
   - stemma di casato senza ramo
   - poi `TIPO=ARMIGERIA_BASE`

## Validate + Build

```bash
./proc/validate_data.sh
./proc/build_portale.sh
```

Genera:

- `PORTALE_GN/people/*.html`
- `PORTALE_GN/families/*.html`
- `PORTALE_GN/sources/*.html`
- `PORTALE_GN/heraldry/*.html`
- `PORTALE_GN/reports/index.html`

Log/report:

- `out/VALIDATION_REPORT.txt`
- `out/BUILD_INDEX.DAT`
- `logs/missing_heraldry_assets.log`

## Inserimento manuale record

```bash
./proc/new_person.sh I999 COGNOME NOME M F000001 S000001 "NOTA"
./proc/new_family.sh F999 COGNOME-FAMIGLIA P000001 P000002 P000003 2000-01-01 PALERMO S000001 "NOTA"
./proc/new_source.sh ARCHIVIO "Titolo fonte" 2026-03-01 ARCH RIF "" "NOTE"
```

## Regole file

- UTF-8 senza BOM
- 1 record = 1 riga
- delimitatore `|`
- no spazi attorno al delimitatore
- date: `YYYY` o `YYYY-MM` o `YYYY-MM-DD` o vuoto
