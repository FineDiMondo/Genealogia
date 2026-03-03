# TEST PLAN MAPPE ASCII LEGACY (MODELLO)

## 0. Metadati Modello
- Documento: `TEST_PLAN_MAPPE_MODELLO`
- Ambito: comandi `maps`, `mappa`, `map`, `proto` e rendering mappe ASCII legacy 1..9
- Versione modello: `v1.0`
- Stato: `APPROVED TEMPLATE`
- Fonti baseline:
  - [docs/man/maps-proto.md](man/maps-proto.md)
  - [assets/js/maps.js](../assets/js/maps.js)
  - [assets/maps/gn370_mappe_ascii.txt](../assets/maps/gn370_mappe_ascii.txt)
- Modalita previste:
  - test manuali tracciati (obbligatori)
  - test E2E snapshot output (opzionali)

## 1. Scopo e obiettivi

### In scope
- Rendering delle MAPPE `1..9` (varianti `A/B/C/D`).
- Comandi:
  - `maps` (elenco mappe e varianti)
  - `mappa <n>` / `mappa <n><variante>`
  - `map <n|n[a-d]>` (alias rapido renderer legacy)
  - `proto ...` (`home/world/legend/nav/css/lint/all`)
- Regole di guard e warning `MAP-GUARD` emesso da `proto` e `mappa` (token mancanti, duplicazioni, verbosita).

### Out of scope
- Rendering geografico SVG `map --period <era>` (solo smoke opzionale).
- Verifica storica/genealogica dei contenuti.

## 2. Definition of Done
Un test e `PASS` se:
- output deterministico e coerente con naming/varianti attese;
- titolo mappa corretto (match con `LEGACY_MAP_NAMES`);
- layout coerente per variante `A/B/C/D`;
- nessuna perdita dei caratteri box drawing (es. top-left, orizzontale, verticale) e nessun mojibake;
- `MAP-GUARD` presente solo quando atteso.

### Criteri di uscita
- `0` difetti bloccanti (crash, output vuoto, comando non riconosciuto).
- `0` difetti alti su:
  - variante errata;
  - titolo errato;
  - rottura layout `80x24` per varianti `D`;
  - rottura legenda.

## 3. Ambiente e precondizioni

### Ambiente
- Browser desktop: Chrome e Firefox.
- Esecuzione su ambiente principale e, se disponibile, su build locale.

### Precondizioni
- File mappe raggiungibile: `assets/maps/gn370_mappe_ascii.txt`.
- Console GN370 operativa per digitazione comandi.

## 4. Strategia di test
1. Smoke (2-3 minuti)
   - `maps` mostra elenco `1..9` e varianti.
   - `mappa 1a` e `mappa 9d` producono output non vuoto.
2. Functional
   - copertura completa comandi + mappe 1..9, varianti `A/B/C/D`, legenda, titolo, simboli.
3. Negative e robustezza
   - input invalidi, varianti inesistenti, range non valido, spaziature e case.
4. Non-functional leggero
   - prestazioni percepite, ripetizione comandi, assenza leak stato tra mappe.

## 5. Test comuni (valide per tutte le mappe)

### TC-COM-01 - `maps` elenca 1..9 + varianti
Step:
1. Eseguire `maps`.

Expected:
- elenco mappe `1..9`;
- indicazione varianti `A/B/C/D`;
- naming coerente con tabella legacy.

### TC-COM-02 - `mappa <n>` default variante
Step:
1. Eseguire `mappa 1`.

Expected:
- rendering legacy senza errori;
- default variante coerente con implementazione (contratto esplicito).

### TC-COM-03 - `mappa <n><variante>` happy path
Step:
1. `mappa 2a`
2. `mappa 2b`
3. `mappa 2c`
4. `mappa 2d`

Expected:
- output differente e coerente con sezioni `2A/2B/2C/2D`.

### TC-COM-04 - `map` alias rapido
Step:
1. `map 3`
2. `map 3d`

Expected:
- risultato uguale o semanticamente equivalente a `mappa 3` / `mappa 3d`.

### TC-COM-05 - MAP-GUARD warning
Step:
1. Preparare dataset/file mappe con difetto controllato (token obbligatorio mancante o duplicazione eccessiva).
2. Eseguire `mappa nX` o `proto ...`.

Expected:
- compare warning `MAP-GUARD` coerente col difetto;
- rendering non va in crash (degrado controllato).

### TC-COM-06 - input invalidi
Step/Expected:
1. `mappa 0` -> errore out-of-range o help breve.
2. `mappa 10` -> errore out-of-range.
3. `mappa 1e` -> errore variante non valida.
4. `mappa x` -> errore argomento non numerico.
5. `map` -> help o errore controllato.

## 6. Piano per mappa (copertura minima sufficiente)

Per ogni mappa: 4 test core (`A/B/C/D`) + 2 test strutturali (titolo/legenda/simboli).

### MAPPA 1 - ALBERO GENEALOGICO
- `TC-M1-A`: `mappa 1a`, verifica intestazione, legenda (`*`, `+`, `-`, `|`, `\\`, `[ ]`), no wrap distruttivo.
- `TC-M1-B`: `mappa 1b`, verifica struttura verticale e marker origine documentata.
- `TC-M1-C`: `mappa 1c`, verifica pannelli coordinate e sezioni `FILTRI/CANVAS/DETTAGLIO`.
- `TC-M1-D`: `mappa 1d`, verifica cornice ASCII-370, `COLS=80 ROWS=24`, PF e prompt `CMD:`.
- `TC-M1-LEG`: legenda completa e simboli realmente presenti nel canvas.

### MAPPA 2 - RETE DELLE FAMIGLIE
- `TC-M2-A/B/C/D`: `mappa 2a..2d`, verifica nodi `[CASATO]`, legami `-`/`|`, evento fondante (es. marker dedicato se previsto).
- `TC-M2-SEM`: legenda coerente con simboli usati (`[ ]`, `-`, `|`, `X`).

### MAPPA 3 - CRONOLOGIA DEGLI EVENTI
- `TC-M3-A/B/C/D`: presenza linea `=====`, marker `B/M/D/!/ ?`, barre era storica, variante D con pannelli coerenti.
- `TC-M3-FILTER`: se supportato, cambio filtro evento modifica enfasi/visibilita senza rotture.

### MAPPA 4 - MAPPA DEI LUOGHI
- `TC-M4-A/B/C/D`: `mappa 4a..4d`, verifica simbolo luogo `^`, collegamenti, legenda, coerenza ASCII-370 per D.
- `TC-M4-NAME`: titolo coerente con naming legacy.

### MAPPA 5 - GERARCHIA DEI TITOLI
- `TC-M5-A/B/C/D`: verifica simboli titolo (es. `^`) e rami di subordinazione.
- `TC-M5-CONS`: nessun loop grafico, coerenza tra legenda e canvas (`^TITLE^` se presente).

### MAPPA 6 - DISTRIBUZIONE DELLE PROPRIETA
- `TC-M6-A/B/C/D`: verifica simbolo `$` e connessioni a persone/famiglie.
- `TC-M6-DATA`: su dataset vuoto, placeholder "nessun dato" senza crash.

### MAPPA 7 - ANALISI DELLE RELAZIONI
- `TC-M7-A/B/C/D`: verifica coppie `< >` e connessioni complesse.
- `TC-M7-EDGE`: relazioni multiple (es. piu matrimoni) non rompono allineamento.

### MAPPA 8 - SUGGERIMENTI IA
- `TC-M8-A/B/C/D`: verifica token `?HINT?` e `~GAP~` se previsti.
- `TC-M8-NONDET`: run-to-run stabile; se dinamico, struttura e legenda restano stabili.

### MAPPA 9 - NAVIGAZIONE 9 MONDI - YGGDRASIL
- `TC-M9-A/B/C/D`: i 9 mondi (`1..9`) devono essere chiaramente renderizzati.
- `TC-M9-PROTO`: `proto world 1` e `proto world 9`, vista coerente con mondo/slug/steps.
- `TC-M9-LINT`: `proto lint all` (o scope supportato), segnala violazioni senza crash.

## 7. Evidenze e tracciabilita
Per ogni test case salvare:
- comando eseguito (stringa esatta);
- timestamp;
- output raw;
- screenshot (obbligatorio per varianti `D`);
- esito `PASS/FAIL`;
- difetto collegato (ID ticket).

Se difetto layout:
- allegare output;
- riga/colonna approssimativa;
- atteso vs rilevato.

## 8. Rischi e mitigazioni
- Encoding box drawing: rischio alto su terminali Windows/Android.
  - Mitigazione: test dedicati su varianti `D` e controllo legenda.
- Cache legacy o file mappe non raggiungibile: rischio medio.
  - Mitigazione: smoke + test negative su path/file.
- Drift tra `LEGACY_MAP_NAMES` e file mappe: rischio medio.
  - Mitigazione: `TC-COM-01` + test nome per mappa.
- `MAP-GUARD` troppo aggressivo: rischio medio.
  - Mitigazione: confrontare dataset normale vs dataset corrotto controllato.

## 9. Matrice di esecuzione (template run)

| Release | Ambiente | Build/Commit | Tester | Data |
|---|---|---|---|---|
| `<RILASCIO>` | `<ENV>` | `<SHA>` | `<NOME>` | `<YYYY-MM-DD>` |

| Test ID | Comando/Scenario | Esito | Evidenza | Ticket |
|---|---|---|---|---|
| `TC-COM-01` | `maps` | `PASS/FAIL` | `<link output/screenshot>` | `<ID o N/A>` |
| `TC-COM-02` | `mappa 1` | `PASS/FAIL` | `<link output/screenshot>` | `<ID o N/A>` |
| `...` | `...` | `...` | `...` | `...` |

## 10. Registro difetti (template)

| Defect ID | Severita | Test ID | Ambiente | Descrizione sintetica | Stato |
|---|---|---|---|---|---|
| `MAP-001` | `HIGH` | `TC-M1-D` | `<ENV>` | Bordo ASCII spezzato su colonna 79 | `OPEN/CLOSED` |

## 11. Estensione automazione E2E (opzionale)
- Eseguire i comandi da harness E2E (es. Playwright) e salvare snapshot testuali.
- Normalizzare timestamp/rumore per confronto deterministico.
- Coprire almeno:
  - `maps`
  - `mappa 1a`, `mappa 1d`, `mappa 9d`
  - `map 3`, `map 3d`
  - `proto world 1`, `proto lint all`
