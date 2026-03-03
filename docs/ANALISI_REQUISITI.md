# ANALISI REQUISITI GN370 - Versione 0

## Requisiti funzionali

1. Avvio shell deterministico con stato iniziale noto.
2. Import dati su azione esplicita utente (no auto-load).
3. Supporto pipeline GEDCOM con gestione conflitti.
4. Supporto import specialistici: araldica, notarile, nobiltario.
5. Comandi shell uniformi per consultazione e diagnostica.
6. Esportazione DB in formato ZIP.

## Requisiti non funzionali

- Runtime client-side senza dipendenze backend applicative.
- Gate su accesso dati per impedire letture premature.
- Tracciabilita operazioni import e sessione.
- Documentazione minima operativa allineata al codice.

## Invarianti V0

- `DB.status=EMPTY` al boot/reset.
- `ctx.openedRecord=null` al boot.
- Nessun fetch dati automatico in fase boot.
- Batch agent GEDCOM eseguiti solo post-write.
- Ogni record importato produce entry in `IMPORT_LOG`.
- Ogni record importato produce anche entry in `IMPORT_LOG_FAMILY` con `family_key` e `log_ts`.

## Fuori scope V0

- Orchestrazione backend multiutente.
- Workflow autorizzativi avanzati.
- Packaging nativo definitivo per tutti i target.
