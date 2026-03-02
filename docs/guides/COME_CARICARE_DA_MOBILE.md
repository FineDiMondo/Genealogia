# Come Caricare Da Mobile

1. Carica immagini/documenti nella cartella `01_raw/` (cloud sync o file manager).
2. Esegui ingest con ID record canonico:

```bash
python -m src.portale_giardina.pipeline ingest --record-id "YYYY-MM-DD__tipo__soggetti__luogo__slug" --with-hash
```

3. Aggiorna il record YAML in `03_records/` aggiungendo i file in `media`.
4. Valida:

```bash
make validate
```

5. Rigenera il sito:

```bash
make build
```

