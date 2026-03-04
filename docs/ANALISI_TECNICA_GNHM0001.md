# ANALISI TECNICA GNHM0001 - Home Gateway Risorgimentale

## 1. Obiettivo tecnico

Realizzare un gateway di ingresso UI (`GNHM0001`) che riduca i passaggi manuali per accedere al prototipo 9 mondi, mantenendo compatibilita con l'architettura attuale (IIFE, shell routing, gate runtime).

## 2. Architettura target

### Componenti nuovi

- `assets/js/home-gateway.js`
  - costruzione view iniziale `GNHM0001`;
  - binding CTA/PF a comandi interni;
  - gestione stato locale del gateway (idle/nav/import/console).

- `assets/css/home-gateway.css`
  - layout dashboard 3 colonne (transazioni, mondi, registro);
  - integrazione token risorgimentale esistenti;
  - responsive desktop/mobile.

### Componenti estesi

- `assets/js/render.js`
  - API `showHomeGateway()` e helper rendering card/stato.

- `assets/js/boot.js`
  - sostituzione chiamata iniziale `showHomeImport()` con `showHomeGateway()`.

- `assets/js/router.js`
  - alias operativi (es. `start`, `home`, `risorgimento`) opzionali e backward compatible.

## 3. Modello di integrazione

### Sequenza boot prevista
1. Init render/output.
2. Apply tema default (risorgimentale).
3. Reset memoria e `DB: EMPTY`.
4. Render `GNHM0001`.
5. Focus su CTA primaria o input shell (configurabile).

### Orchestrazione eventi UI

`home-gateway.js` non deve eseguire logica dati diretta; deve invocare:
- `GN370.ROUTER.dispatch(...)` per navigazioni prototipo;
- `GN370.RENDER.openFilePicker(...)` per import su gesture;
- `GN370.RENDER.focusInput()` per passaggio console.

In questo modo il gateway resta presentazionale/orchestrativo e non duplica regole business.

## 4. Contratti funzionali inter-modulo

- `HOME_GATEWAY.OPEN`: render pannello home.
- `HOME_GATEWAY.ACTION.PF1`: dispatch `proto home 80`.
- `HOME_GATEWAY.ACTION.WORLD_n`: dispatch `proto world n 80`.
- `HOME_GATEWAY.ACTION.PF2`: trigger `import gedcom` con picker.
- `HOME_GATEWAY.ACTION.PF3`: trigger `db import`.
- `HOME_GATEWAY.ACTION.PF4`: focus console.

Tutti gli eventi scrivono `JOURNAL.entry(...)` con `op_type` dedicato:
- `HOME_GATEWAY_OPEN`
- `HOME_GATEWAY_PF`
- `HOME_GATEWAY_WORLD_SELECT`
- `HOME_GATEWAY_ERROR`

## 5. Dati e persistenza

Nessuna modifica schema DB.

Persistenza opzionale (client-side):
- `gn370.home.last_world`
- `gn370.home.last_action`

La persistenza deve essere best effort e non bloccante (se storage non disponibile, fallback silenzioso).

## 6. Requisiti non funzionali

- Compatibilita: browser moderni gia supportati da V0.
- Performance: costo render home <= 30 ms su hardware medio.
- Affidabilita: nessun side effect su gate DB/fetch.
- Accessibilita:
  - navigazione tastiera su CTA e card;
  - `aria-label` per comandi rapidi;
  - contrasto colori conforme tema risorgimentale.

## 7. Sicurezza e robustezza

- Nessun `innerHTML` da input utente non sanitizzato.
- Nessun comando shell eseguito da query string senza whitelist.
- Eventuali parametri URL (`view`, `theme`) validati contro set noto.

## 8. Strategia test

### Test unitari
- mapping card mondo -> comando `proto world n 80`;
- fallback stato quando `GN370.MAPS` non disponibile.

### Test integrazione/E2E
- apertura `/` mostra `GNHM0001`;
- click CTA primaria produce output home prototipo;
- click card mondo produce output mondo corretto;
- passaggio console non rompe input command-line.

### Regressione obbligatoria
- `tests/gate_tests.js`;
- `tests/boot_invariants.test.js`;
- `tests/multienv_tests.js`;
- suite Playwright esistente.

## 9. Piano di rilascio

- Fase 1: feature flag `gn370.home.gateway.enabled=true` (default on in dev/test).
- Fase 2: monitor KPI di adozione e errori comando iniziale.
- Fase 3: consolidamento docs/man e rimozione eventuale fallback legacy home.

## 10. Rischi e mitigazioni

- Rischio: regressione del boot deterministico.
  - Mitigazione: no fetch automatico, test invarianti aggiornati.

- Rischio: duplicazione logica con router.
  - Mitigazione: gateway usa solo dispatch e API render pubbliche.

- Rischio: confusione tra home guidata e shell storica.
  - Mitigazione: pulsante esplicito "Console Esperto" e prompt sempre visibile.

## 11. Backlog tecnico minimale

1. Implementare `home-gateway.js` + `home-gateway.css`.
2. Integrare `showHomeGateway()` in `render.js`.
3. Aggiornare `boot.js` per nuova home default.
4. Aggiungere eventi `JOURNAL` specifici.
5. Estendere test E2E su flussi PF e card mondo.
