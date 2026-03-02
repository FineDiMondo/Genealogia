# Come Aggiungere Uno Stemma SVG

1. Inserisci il file SVG in `01_raw/`.
2. Esegui ingest con ID stemma:

```bash
python -m src.portale_giardina.pipeline ingest --record-id "YYYY-MM-DD__stemma__soggetti__luogo__slug" --with-hash
```

3. Crea o aggiorna `03_records/<id>.yml`:
   - `type: stemma`
   - `status: DOCUMENTATO|ATTRIBUITO|RICOSTRUITO`
   - `family_id` obbligatorio
   - `blazon` obbligatorio
   - `media[].file` coerente con `02_curated/`
4. Valida e builda:

```bash
make validate
make build
```

