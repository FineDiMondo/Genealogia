# Job Progress UI (GN370)

La shell 370 include un job engine browser-side per pipeline record-by-record.

## Job disponibili

- `JOB RUN IMPORT_RECORDS`
- `JOB STATUS`
- `JOB LOG --tail 50`

## Step pipeline

1. `LOAD_COPYBOOKS`
2. `SCAN_RECORDS_DIRS`
3. `PARSE_RECORDS`
4. `BUILD_INDEXES`
5. `APPEND_EVENTS` (preview in modalità web)
6. `REPORT`

## Progress bar retro

Formato usato:

`[##########--------------]   42%  PARSE_RECORDS  (21/50)  PERSON`

- Larghezza barra: 24 caratteri.
- Update dinamico su `JOB:` context line.
- Log incrementale in output panel (stile batch).

## Comandi record/copybook

- `OPEN REC <TYPE> <ID>`
- `SHOW COPY <TYPE>`
- `VALIDATE REC <TYPE> <ID>`

## Report finale

Al termine di `IMPORT_RECORDS`:

- numero copybook caricati
- record per tipo
- validi/invalidi
- numero eventi preview generati

## Limiti web

- Su GitHub Pages non è possibile scrivere file (`events/indexes`) da frontend.
- In questa build le scritture sono simulate come preview.
- Implementazione write-through demandata alla modalità launcher/batch locale.
