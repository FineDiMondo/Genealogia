# TECHNICAL_SPEC_CURRENT_STATE

## 1. OVERVIEW ARCHITETTURA
1.1 Tipo applicazione
- Applicazione web statica client-side.
- UI shell terminal-style singola pagina (SPA senza framework).
- Runtime primario: browser + JavaScript vanilla.
- Nessun backend applicativo.

1.2 Modalita deploy
- Deploy GitHub Pages tramite `.github/workflows/pages-static.yml`.
- Artifact deploy:
  - Priorita 1: `PORTALE_GN/`
  - Priorita 2: `out/current/site/`
  - Fallback generato: copia `index.html`, `assets/`, `src/`, `version.json`, `service-worker.js`.
- Includi sempre nel deploy:
  - `data/current/`
  - `copybooks/`

1.3 Entry point
- Entry HTML: `index.html`.
- Script caricati in ordine:
  1. `src/copybook/copybook_parser.js`
  2. `src/copybook/record_parser.js`
  3. `src/copybook/record_renderer_370.js`
  4. `assets/vendor/jszip.min.js`
  5. `assets/gn370.js`

1.4 Dipendenze runtime
- Browser APIs:
  - `fetch`
  - `localStorage`
  - `sessionStorage`
  - `caches`
  - `navigator.serviceWorker`
  - `URL`, `Blob`
- Libreria esterna locale:
  - `JSZip` (`assets/vendor/jszip.min.js`)
- Moduli globali richiesti da `gn370.js`:
  - `window.GNCopybook`
  - `window.GNRecord`
  - `window.GNRender370`

1.5 Dipendenze CI/Tooling
- CI test Python (`.github/workflows/tests.yml`): Python 3.12.
- Nessun `package.json` in root.

## 2. STRUTTURA REPOSITORY
2.1 Albero rilevante (funzionale al runtime web)
```text
/
├─ index.html
├─ service-worker.js
├─ version.json
├─ assets/
│  ├─ gn370.css
│  ├─ gn370.js
│  └─ vendor/jszip.min.js
├─ src/
│  └─ copybook/
│     ├─ copybook_parser.js
│     ├─ record_parser.js
│     └─ record_renderer_370.js
├─ copybooks/
│  ├─ PERSON.CPY
│  ├─ FAMILY.CPY
│  └─ EVENT.CPY
├─ data/current/
│  ├─ events.ndjson
│  ├─ stories/
│  │  ├─ index.json
│  │  ├─ SAMPLE.story
│  │  ├─ ALTLINE.story
│  │  └─ TITLES01.story
│  ├─ records/
│  │  ├─ manifest.json
│  │  ├─ index.json
│  │  ├─ PERSON/*.rec
│  │  ├─ FAMILY/*.rec
│  │  └─ EVENT/*.rec
│  ├─ entities/*.ndjson|json
│  ├─ indexes/*.idx
│  └─ meta/*.json
├─ runtime/
│  └─ session_state.json
├─ .github/workflows/
│  ├─ pages-static.yml
│  └─ tests.yml
└─ tx2/ (sottosistema separato)
```

2.2 Ruolo file principali
- `index.html`: layout shell, hook DOM, inclusione script.
- `assets/gn370.css`: stile terminale, layout pannelli.
- `assets/gn370.js`: orchestratore runtime shell, command dispatcher, import/export ZIP, boot.
- `src/copybook/copybook_parser.js`: parser copybook COBOL in schema JS.
- `src/copybook/record_parser.js`: parser record fixed-length su schema copybook.
- `src/copybook/record_renderer_370.js`: renderer testuale progress/copy/record.
- `service-worker.js`: cache statica + bypass cache su `/data/current/`.
- `version.json`: metadati build (`commit`, `buildTimeUtc`, `dataHash`).
- `copybooks/*.CPY`: schema record COBOL.
- `data/current/*`: dataset statico consultato via fetch lazily.
- `tx2/`: sottosistema transazionale separato (UI/pages/schema/jobs/tools indipendenti).

2.3 Sottosistema tx2 (stato repository)
- Presente sotto root con struttura completa (`defs`, `mappe`, `pages`, `schema`, `jobs`, `strumenti`, `ui`, `cobol`, `c`, `copybooks`).
- Non e entrypoint di default della shell GN370 (`index.html`).

## 3. STATE MACHINE ATTUALE
3.1 Stati runtime principali
- UI Mode:
  - `HOME_IMPORT`
  - `STANDARD` (valore stringa vuota `''`)
- DB Status:
  - `EMPTY`
  - `READY`
- Job State:
  - `IDLE` (`state.job.running=false`)
  - `RUNNING` (`state.job.running=true`)
- Context State:
  - `NONE` (`state.current=null`)
  - `ACTIVE` (`state.current={kind,id,title,data}`)

3.2 Transizioni
- Boot -> `HOME_IMPORT` + `DB EMPTY`.
- Import ZIP riuscito -> `STANDARD` + `DB READY`.
- `refresh` command -> reset hard -> ritorno `HOME_IMPORT` + `DB EMPTY`.
- `job run IMPORT_RECORDS|PIPELINE|IMPORT_NORM_VALIDATE_JOURNAL` con DB READY -> `JOB RUNNING` -> `JOB IDLE`.
- `back` -> pop stack context/output se disponibile.

3.3 Trigger
- Trigger UI:
  - click ENTER
  - keydown PF keys
  - selezione file ZIP e pulsante IMPORTA
- Trigger comando testuale:
  - parser comandi da input terminale
- Trigger asincroni:
  - fetch remoto locale statico
  - JSZip async load/generate

## 4. BOOT SEQUENCE ATTUALE
4.1 Sequenza funzioni
1. `boot()` in `assets/gn370.js`.
2. `Memory.reset()`.
3. `loadVersion()` (fetch `version.json` no-store).
4. `renderHeader()`.
5. `renderContext()`.
6. `buildSuggestions(parseCommand(''), '')`.
7. `renderSuggestions()`.
8. `bindUi()`.
9. `dom.cmd.focus()`.
10. `renderHomeImport()`.
11. append output `MEM: CLEAN`, `DB: EMPTY`.
12. `setInterval(renderHeader, 1000)`.

4.2 Fetch al boot
- Effettivo al boot:
  - `version.json?t=<epoch>`.
- Non effettuato al boot:
  - `data/current/events.ndjson`
  - `data/current/stories/index.json`
  - `data/current/stories/*.story`
  - `copybooks/*.CPY`
  - `data/current/records/*`

4.3 Auto-load
- Nessun autoload record/tabelle al boot.
- Nessuna apertura record automatica al boot.
- Nessuna esecuzione automatica `runLoaderJob` al boot.

## 5. DATA MODEL ATTUALE
5.1 Oggetto DB runtime
- Struttura:
```json
{
  "status": "EMPTY|READY",
  "tables": { "<TABLENAME>": { "raw": "<text>" } },
  "indexes": { "<TABLENAME>": { "rows": <number> } },
  "meta": {
    "sourceZip": "<filename.zip>",
    "importedAt": "<ISO8601>",
    "selectedEntries": ["<zip-entry>"]
  }
}
```

5.2 Rappresentazione tabella
- `parseTable(text)` restituisce `{ raw: text }`.
- Nessuna decomposizione strutturata colonne/righe in oggetti typed.

5.3 Index runtime
- `buildIndexes(db)` calcola solo conteggio righe non vuote per tabella.
- Index shape: `{ rows: <line_count_non_empty> }`.

5.4 Dataset statico su filesystem
- `data/current/events.ndjson`: feed eventi NDJSON.
- `data/current/stories/index.json`: indice storie.
- `data/current/stories/*.story`: testo scene.
- `data/current/records/*`: record fixed-length COBOL-like.
- `data/current/entities/*`: dataset entita in NDJSON/JSON.
- `data/current/meta/*`: metadati import/rebuild/hash/stato.
- `data/current/indexes/*.idx`: indici statici lato file.

5.5 Copybook schema
- `copybooks/PERSON.CPY`, `FAMILY.CPY`, `EVENT.CPY`.
- Parser copybook supporta:
  - level 01 record
  - level 05 fields
  - `PIC X(n)` / `PIC 9(n)`
  - `OCCURS n`
  - ignora `REDEFINES`

## 6. MEMORY LIFECYCLE
6.1 Oggetti globali runtime
- `state` (closure privata) include:
  - `uiMode`, `version`, `db`, `ctx`, `cache`, `jobsQueue`, `feed`, `errors`
  - cache lazy: `events`, `storiesIndex`, `copybooks`
  - UI: `current`, `outputLines`, `top`, `history`, `suggestions`, `techBanner`
  - stack navigazione: `stack`
  - job monitor: `job`

6.2 Reset attuale
- `Memory.reset()` esegue:
  - reset `db` a EMPTY
  - reset `ctx`, `cache`, `jobsQueue`, `feed`, `errors`
  - reset cache lazy (`events`, `storiesIndex`, `persons`, `recordManifest`, `copybooks`)
  - reset `current`, `stack`, `job`
  - `memoryClean=true`
  - `selectedZipFileName=''`
  - rimozione `SESSION_KEY` da localStorage/sessionStorage

6.3 Persistenza locale
- `localStorage`:
  - `gn370_history`: storico comandi (max 80)
  - `gn370_session_state_v1`: snapshot sessione salvato dopo ogni execute
- `sessionStorage`:
  - tentativo rimozione `gn370_session_state_v1` in reset
- Nota operativa runtime:
  - boot non ricarica automaticamente lo snapshot sessione.
  - ripristino sessione disponibile via comando `state load <path>` su file JSON.

## 7. ROUTING E COMMAND HANDLER
7.1 Routing applicativo
- Nessun routing URL multi-page lato GN370.
- Routing logico interno basato su comando testuale.

7.2 Parsing comandi
- `tokenize(input)`:
  - split whitespace
  - supporto stringhe quotate `'` o `"`.
- `parseOptions(tokens)`:
  - opzioni slash `/opt value`
  - opzioni long `--opt value`
  - flag boolean se senza valore.
- `parseCommand(raw)`:
  - output `{raw, cmd, args, opts}`.

7.3 Alias comandi
- `h -> help`
- `b -> back`
- `m -> menu`
- `r -> refresh`
- `q -> quit`

7.4 Mappa comandi -> funzioni
- `help` -> `printHelp`
- `menu` -> `printMenu`
- `back` -> `popState`
- `quit` -> warning (disabilitato browser)
- `refresh` -> `Memory.reset` + `renderHomeImport`
- `feed` -> `cmdFeed`
- `import zip` -> `renderHomeImport`
- `commit` -> `commitDb`
- `story list` -> `cmdStoryList`
- `story open <id>` -> `cmdStoryOpen`
- `story play <id>` -> `cmdStoryPlay`
- `open person <id>` -> `cmdOpenPerson`
- `open xref <xref>` -> `cmdOpenXref`
- `open rec <TYPE> <ID>` -> `cmdOpenRec`
- `show card` -> `cmdShowCard`
- `show copy <TYPE>` -> `cmdShowCopy`
- `validate rec <TYPE> <ID>` -> `cmdValidateRec`
- `job` -> `cmdJob`
- `db` -> `cmdDb`
- `cache` -> `cmdCache`
- `explain` -> `cmdExplain`
- `state` -> `cmdState`
- `clear` -> `cmdClear`

7.5 Gestione errori
- Errori runtime command loop:
  - `try/catch` in `execute`.
  - codici interni: `ERR_UNKNOWN_COMMAND`, `ERR_RUNTIME`.
- Output errori su pannello via `(ERR)`.
- Suggestions ricalcolate post-command in `finally`.

## 8. IMPORT MECHANISM (SE ESISTE)
8.1 UI import
- Schermata HOME import (`renderHomeImport`) con:
  - stato `DB EMPTY | MEM CLEAN`
  - input file ZIP
  - filtro nome entry
  - checkbox selezione multipla entry
  - pulsante `IMPORTA` disabilitato senza selezioni
  - pulsante `Seleziona tutto`

8.2 Dipendenza ZIP
- `window.JSZip` obbligatorio.
- Script locale: `assets/vendor/jszip.min.js`.

8.3 Flusso `importZip(file, selectedEntries)`
1. Verifica `file` presente.
2. Verifica almeno una entry selezionata.
3. Verifica `window.JSZip` disponibile.
4. `Memory.reset()`.
5. `state.uiMode=''` (uscita HOME_IMPORT).
6. Caricamento ZIP (`JSZip.loadAsync(file)`).
7. Loop su entry selezionate:
   - `zip.file(entryName)`
   - lettura `entry.async('string')`
   - tablename da basename senza estensione upper-case
   - `state.db.tables[tableName] = { raw: text }`
8. `state.db.status='READY'`.
9. valorizzazione `state.db.meta`.
10. `buildIndexes(state.db)`.
11. output log import + menu.

8.4 Assunzioni parse import
- Entry ZIP considerate file testo.
- Nome tabella derivato dal file name (path zip ignorato salvo basename).
- Collisione nome tabella: overwrite dell'entry precedente.

## 9. EXPORT / COMMIT MECHANISM (SE ESISTE)
9.1 Comando
- `commit`
- alias: `job run COMMIT_DB` / `job run COMMIT`

9.2 Flusso `commitDb()`
1. Gate `requireDbReady('COMMIT_DB')`.
2. Verifica JSZip disponibile.
3. `timestamp = nowYYYYMMDDHHMM()`.
4. `filename = <timestamp>.zip`.
5. Crea zip in memoria.
6. Per ogni tabella ordinata:
   - path zip: `tables/<TABLENAME>.table`
   - contenuto: `serializeTable(tableObj)`
7. `generateAsync({type:'blob'})`.
8. Trigger download browser via anchor object URL.
9. Push evento in `state.feed`.
10. Log `(OK) commit creato: <timestamp>.zip`.

9.3 Serializzazione tabella
- Se `tableObj.raw` e stringa: usa raw.
- Altrimenti: `JSON.stringify(tableObj, null, 2)`.
- Fallback finale: `String(tableObj)`.

9.4 Formato nome file commit
- 12 cifre: `YYYYMMDDHHMM`.
- Nessun separatore.

## 10. GATE CONTROL
10.1 Funzione gate
- `requireDbReady(opName)`:
  - condizione: `state.db.status === 'READY'`
  - altrimenti output `(ERR) DB non caricato. Importa ZIP. (<opName>)`

10.2 Comandi protetti da gate
- `open person`
- `open xref`
- `open rec`
- `validate rec`
- `job run IMPORT_RECORDS|PIPELINE|IMPORT_NORM_VALIDATE_JOURNAL`
- `commitDb`

10.3 Comandi non gated
- `feed`
- `story list/open/play`
- `show copy`
- `cache *`
- `db *` (status e simulazioni)
- `state *`
- `help/menu/explain/clear/back`

## 11. UI FLOW
11.1 Pagine principali
- Entry unica: `index.html`.
- Layout fisso:
  - header
  - output panel
  - context panel
  - command row
  - footer PF keys

11.2 Modalita UI
- `HOME_IMPORT_MODE`:
  - output panel occupato da form import ZIP.
  - `renderOutput()` bypassato.
- `STANDARD`:
  - output panel testuale con scroll pagina logico.

11.3 Navigazione interna
- Navigazione a comandi, non per route URL.
- `pushState()` su operazioni contestuali (story open/play, open person/xref/rec, show copy).
- `popState()` richiamato da comando `back` o PF3.
- Stack limit: 25 snapshot.

11.4 PF keys binding
- `F1` -> `help`
- `F3` -> `back`
- `F5` -> `refresh`
- `F7` -> page up output
- `F8` -> page down output
- `F9` -> `menu`
- `F10` -> focus/select command input
- `F12` -> warning quit disabled

11.5 Input UX
- Enter: esegui comando.
- Tab: autocomplete prima suggestion.
- ArrowUp/ArrowDown: history locale comandi.

## 12. NETWORK INTERACTIONS
12.1 Chiamate fetch in `assets/gn370.js`
- Boot:
  - `version.json?t=<timestamp>` (`cache:no-store`).
- Lazy su comando:
  - `data/current/events.ndjson` (`feed`).
  - `data/current/stories/index.json` (`story list/open`).
  - `data/current/stories/<id>.story` (`story play`).
  - `copybooks/<TYPE>.CPY` (`show copy`).
  - `runtime/session_state.json` o path custom (`state load`).

12.2 Costruzione URL
- `fetchText`:
  - normalizza path rimuovendo slash iniziale
  - encode `#` in `%23`
  - opzionale query `?v=<sha7>` per `liveData:true`
- `fetchJson` delega `fetchText`.

12.3 Service worker interactions
- File presente: `service-worker.js`.
- Caching strategy definita:
  - bypass cache per path contenente `/data/current/` (`fetch no-store`)
  - cache-first per asset statici.
- Registrazione SW:
  - non eseguita automaticamente da `boot()` attuale.
- Comandi `cache status/update/clear` operano su eventuale registrazione esistente.

12.4 Nessuna chiamata backend applicativo
- Tutte le fetch puntano a file statici serviti dalla stessa origin.

## 13. CONSTRAINTS IMPLICITI
13.1 Assunzioni formato dati
- Eventi:
  - `events.ndjson` con una riga JSON valida per evento.
- Stories:
  - `stories/index.json` con array `stories`.
  - file `.story` con scene marcate da righe `# <titolo scena>`.
- Copybook:
  - campi dichiarati a livello 05 con `PIC X(n)|9(n)`.
- Tabelle ZIP import:
  - entry leggibili come testo.
  - naming tabella derivato da filename.

13.2 Assunzioni stato runtime
- Operazioni record-centriche richiedono `DB.status=READY`.
- `Memory.reset` non cancella `gn370_history` (history comandi persiste).
- `state.memoryClean` inizializzato true e non riportato a false nelle operazioni correnti.

13.3 Assunzioni dipendenze globali
- `show copy` richiede parser/renderer globali caricati.
- `import`/`commit` richiedono `window.JSZip` disponibile.

13.4 Assunzioni path
- Path fetch relativi alla root `index.html` deployata.
- Deploy Pages include obbligatoriamente `data/current` e `copybooks`.

13.5 Assunzioni su timestamp commit
- Granularita minuto (`YYYYMMDDHHMM`).

13.6 Assunzioni su shell comandi
- Command parser case-insensitive su `cmd` tramite lower-case.
- Entita TYPE normalizzate upper-case in comandi record/copy.

## 14. RISCHI TECNICI OSSERVABILI
14.1 Runtime/UI
- `state.persons` e `state.recordManifest` rimangono nel modello stato ma non partecipano ai flussi principali correnti.
- `renderMainMenu()` definita ma non usata nel routing corrente.
- `selectedZipFileName` presente nello stato ma non valorizzato durante import.

14.2 Job orchestration
- Branch condizionale `if (name !== 'BOOT_LOADER')` in `runLoaderJob` mantenuto, mentre `BOOT_LOADER` non e richiamato nel boot corrente.
- `runLoaderJob` marca tutte le tabelle come valide senza validazioni semantiche di schema/contenuto.

14.3 Persistenza locale
- Snapshot sessione viene persistito a ogni comando ma non auto-ripristinato al boot.
- `gn370_history` non viene cancellato da `Memory.reset`.

14.4 Import/export
- Collisione nomi tabella possibile quando piu entry ZIP producono stesso basename upper-case.
- Commit filename a granularita minuto puo collidere in commit multipli nello stesso minuto.

14.5 Service worker/cache
- `service-worker.js` cache list statica include asset core ma non include esplicitamente `assets/vendor/jszip.min.js`.
- Presenza SW dipende da registrazioni pregresse: comportamenti cache possono variare tra client.

14.6 Data access consistency
- Comandi `feed/story/show copy/state load` effettuano fetch anche con DB `EMPTY`.
- Comandi `db backup/reset/rebuild/restore` sono simulazioni web mode non collegate a mutazioni reali su filesystem.

14.7 Security/Surface
- `state load <path>` consente fetch di path arbitrari relativi/origin per caricare payload JSON in sessione.
