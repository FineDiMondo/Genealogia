# LEXICON GN370 - Versione 0

- **DB.status**: stato runtime (`EMPTY`, `LOADING`, `READY`, `ERROR`).
- **Gate**: blocco operazioni dati quando DB non e pronto.
- **CTX**: contesto sessione runtime (`openedRecord`, `activeStory`, ecc.).
- **IMPORT_LOG**: log per-record della pipeline GEDCOM.
- **IMPORT_LOG_FAMILY**: log per-record partizionato per famiglia (`family_key`) usato come base di normalizzazione AI-assisted.
- **JOURNAL**: registro append-only eventi shell/sessione.
- **Batch agents**: controlli post-write (IC/NORM2/CORR).
- **Prototipo**: modalita `proto` per schermate e sequenze mondo.
- **MAP-GUARD**: warning automatico su output verbose/duplicato/non conforme.
- **Copybook**: sorgente storico schema COBOL.
- **OPFS**: persistenza browser-side per SQLite WASM quando disponibile.
- **GNHM0001**: identificativo funzionale della nuova home gateway risorgimentale.
- **Home Gateway**: pagina iniziale guidata con CTA/PF per accesso rapido ai 9 mondi.
