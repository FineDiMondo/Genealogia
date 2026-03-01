# README_COBOL_STYLE

## Filosofia

Il progetto adotta uno stile "COBOL su Unix":

- base dati in file sequenziali record-oriented (`.DAT`)
- layout tracciati documentato in `copy/*.CPY`
- job operativi shell in `proc/`
- output statico HTML generato in `PORTALE_GN/generated/`

Nessun database e nessun JSON come base dati.

## Struttura directory

```text
src/      programmi sorgente e utility
copy/     copybook (spec tracciati record)
data/     file sequenziali .DAT
proc/     job shell (build, validate, new_*)
out/      output tecnici (report, indici flat)
docs/     documentazione operativa
logs/     log ultima esecuzione job
PORTALE_GN/generated/ output HTML pubblicabile su Pages
```

## Tracciati record

Delimitatore: `|` senza spazi intorno.

### PERSONE.DAT

`ID|COGNOME|NOME|SESSO|DATA_NASCITA|LUOGO_NASCITA|DATA_MORTE|LUOGO_MORTE|ID_FAMIGLIA|ID_FONTI|NOTE|STATO`

Esempio:

`P000001|GIARDINA|DANIEL|M|1988-04-12|PALERMO|||F000001|S000001,S000002|CURATORE PROGETTO|VERIFICATO`

### FAMIGLIE.DAT

`ID|COGNOME_FAMIGLIA|MACRO_GRUPPO|TIPO|ORIGINE|ID_FONTI|NOTE`

### FONTI.DAT

`ID|TIPO|TITOLO|DATA_DOCUMENTO|ARCHIVIO|RIFERIMENTO|URL|NOTE`

### EVENTI.DAT

`ID|TIPO_EVENTO|DATA_EVENTO|LUOGO|ID_PERSONA|ID_FAMIGLIA|ID_FONTE|DESCRIZIONE`

## Regole

- ID sequenziali:
  - Persona: `P000001`
  - Famiglia: `F000001`
  - Fonte: `S000001`
  - Evento: `E000001`
- Date ISO: `YYYY-MM-DD` oppure campo vuoto.
- Encoding file: UTF-8 senza BOM.
- Righe commento ammesse con `#`.

## Aggiungere record

```bash
./proc/new_person.sh COGNOME NOME M F000001 S000001,S000002 "NOTA"
./proc/new_family.sh COGNOME_FAMIGLIA 2 COLLATERALE SICILIA S000001 "NOTA"
./proc/new_source.sh TIPO "TITOLO FONTE" 2026-03-01 ARCHIVIO RIF-001 "" "NOTA"
```

## Validare

```bash
./proc/validate_data.sh
```

Output:

- `out/VALIDATION_REPORT.txt`
- `logs/validate_latest.log`

## Generare portale statico

```bash
./proc/build_portale.sh
```

Output HTML:

- `PORTALE_GN/generated/index.html`
- `PORTALE_GN/generated/people/*.html`
- `PORTALE_GN/generated/families/*.html`
- `PORTALE_GN/generated/sources/*.html`
- `PORTALE_GN/generated/reports/index.html`

Indice tecnico flat:

- `PORTALE_GN/generated/LISTA.DAT`
- `out/BUILD_INDEX.DAT`
