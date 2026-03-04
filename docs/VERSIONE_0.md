# GN370 - Documento Master Versione 0

## 1) Scope V0

Versione 0 e la baseline operativa del progetto GN370:

- shell web statica con comandi testuali;
- pipeline GEDCOM end-to-end lato client;
- import dati complementari (CSV araldico, XML notarile, JSON nobiltario);
- DB embedded/browser-side con reset deterministico all'avvio;
- suite minima di test di gate e coerenza runtime.

## 2) Principi non negoziabili

- Boot deterministico: stato iniziale sempre `DB.status=EMPTY`.
- Nessun data fetch automatico in boot.
- Ogni import passa da gesture utente.
- Gate attivo: accesso dati consentito solo quando DB e READY.
- Tracciamento import su `IMPORT_LOG`.
- Tracciamento per famiglia su `IMPORT_LOG_FAMILY` (`family_key`, `log_ts`) con riuso nelle importazioni successive.

## 3) Stato moduli V0

- Shell/router: attivo.
- Rendering terminale: attivo.
- DB engine e gate: attivo.
- Pipeline GEDCOM S1..S7: attiva.
- Import herald/notarial/nobility: attivo.
- Mappe ASCII legacy e prototipo 9 mondi (`proto`): attivo.
- SQL runtime browser (OPFS/WASM/fallback): attivo.

## 4) Comandi ufficiali V0

### Core
- `help`, `man <cmd>`, `status`, `clear`, `quit`

### DB
- `db import`
- `db list`
- `db show <TABLENAME> [--limit N]`
- `db reset`
- `db export`
- `mem refresh`

### Import
- `import gedcom [--dry-run] [--auto-skip-low] [--strict]`
- `import status`
- `import log [--n N] [--record <id>] [--family <family_key>]`
- `import conflicts`
- `import review <corr_id>`
- `import accept <corr_id>`
- `import batch rerun`
- `import herald`
- `import notarial`
- `import nobility`

### Navigazione e analisi
- `tree --root <id> --depth <n>`
- `map --period <era>`
- `timeline --person <id>`
- `maps`
- `mappa <n|n[a-d]>`
- `proto home|world|legend|nav|css|all|lint`

### Utilita
- `open <entity> <id>`
- `find person|house|title [--name testo]`
- `validate`
- `monitor db|system|herald|env|perf`
- `journal tail --n <N>`
- `journal grep <pattern>`
- `config show`
- `config set <key> <value>`
- `theme <nome>`
- `add tx statico <testo>`

## 5) Output attesi V0

- UI terminale stabile su desktop browser moderni.
- Import GEDCOM con conflitti gestibili via comandi.
- Tracciamento step pipeline e log consultabili.
- Log familiari persistenti inclusi nel backup ZIP export.
- Esportazione DB in ZIP con naming coerente.

## 6) Limiti noti V0

- Nessun backend server applicativo persistente.
- Persistenza SQL dipendente da ambiente browser.
- Build multipiattaforma native in fase di consolidamento.
- Documentazione estesa in `docs/progetto_riferimento/` non normativa per V0.

## 7) Criteri di uscita da V0

- Regressione zero sulle invarianti di boot/gate.
- Allineamento completo man/docs con comandi reali.
- Pipeline import stabile su dataset campione.
- Pacchetto documentale unico e coerente.

## 8) Evoluzione documentata (GNHM0001)

E stata definita una proposta di revisione completa della pagina iniziale per ridurre attrito d'ingresso e rendere immediato l'accesso alla vista risorgimentale/prototipo.

Documenti di riferimento:
- `docs/ANALISI_FUNZIONALE_GNHM0001.md`
- `docs/ANALISI_TECNICA_GNHM0001.md`

Principi garantiti dalla proposta:
- invarianti di boot/gate invariati;
- no auto-fetch dati in fase di avvio;
- canale shell esperto preservato.
