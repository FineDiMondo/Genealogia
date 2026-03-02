# GIARDINA - COBOL-like Project Structure

Struttura standard:

- `00_DOCS` metodo, standard, assessment
- `01_COPY` contratti COPY
- `02_DATA` raw/curated/records
- `03_PROG` programmi batch
- `04_JCL` orchestrazione make
- `05_OUT` output sito, indici, report
- `06_TEST` test

## Comandi

Da root repository:

```bash
python GIARDINA/03_PROG/batch.py compile-copy
python GIARDINA/03_PROG/batch.py validate
python GIARDINA/03_PROG/batch.py build
python GIARDINA/03_PROG/batch.py ingest --record-id "YYYY-MM-DD__TYPE__SUBJECTS__PLACE__SLUG"
python GIARDINA/03_PROG/batch.py all
```

Oppure:

```bash
cd GIARDINA/04_JCL
make validate
make build
make all
```

Return code batch:

- `0` OK
- `4` warning
- `8` error
