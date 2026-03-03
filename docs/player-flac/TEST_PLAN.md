# TEST PLAN - PLAYER FLAC

## 1. Obiettivo
Validare il modulo PLAYER FLAC in termini funzionali, deterministici e di integrazione con GN370 shell/UI.

## 2. Ambito test
- Parser comandi e validazione FLAC.
- Stato e reason codes.
- UI `/player/` e controlli PF.
- Integrazione shell GN370 (pagina principale).
- Policy Service Worker no-audio-cache.

## 3. Precondizioni
- Repo aggiornato con modulo player.
- Ambiente locale:
  - `npm install`
  - server statico: `npm run serve`
- Browser moderno (Chrome/Edge/Firefox).

## 4. Test automatizzabili

### T-AUTO-001 Parser command-core
- Comando: `npm run test:player`
- Atteso: tutti PASS.

### T-AUTO-002 Regressione gate/base
- Comando: `npm test`
- Atteso: suite base GN370 in PASS.

### T-AUTO-003 SQL runtime wiring (non regressione)
- Comando: `npm run test:sql`
- Atteso: PASS.

## 5. Test manuali

### T-MAN-001 Navigazione modulo
- Step:
  1. Aprire `http://localhost:8080/`.
  2. Cliccare link `Apri modulo PLAYER FLAC`.
- Atteso:
  - pagina `/player/` raggiunta;
  - videata con campi FILE/STATE/TIME/DURATION/SR-BIT-CH/VOL.

### T-MAN-002 HELP/STAT
- Step:
  1. In `/player/`, eseguire `HELP`.
  2. Eseguire `STAT`.
- Atteso:
  - record `RC=0 RSN=0 ...`;
  - elenco comandi in seconda riga per HELP.

### T-MAN-003 Reiezione formato non FLAC
- Step:
  1. Eseguire `LOAD ./samples/test.mp3`.
- Atteso:
  - `RC=8 RSN=1001`.

### T-MAN-004 LOAD/PLAY/PAUSE/STOP FLAC
- Step:
  1. Caricare file `.flac` tramite file picker oppure `LOAD <url.flac>`.
  2. Eseguire `PLAY`.
  3. Eseguire `PAUSE`.
  4. Eseguire `STOP`.
- Atteso:
  - sequenza stati: `LOADED -> PLAYING -> PAUSED -> STOPPED`;
  - record deterministici ad ogni comando.

### T-MAN-005 SEEK valido e out-of-range
- Step:
  1. Traccia caricata.
  2. `SEEK 10`.
  3. `SEEK 999999`.
- Atteso:
  - primo: `RC=0 RSN=0`;
  - secondo: `RC=8 RSN=1007`.

### T-MAN-006 Playlist PLS/NEXT/PREV
- Step:
  1. Caricare almeno 2 FLAC con `LOAD` ripetuto.
  2. `PLS`.
  3. `NEXT`, `PREV`.
- Atteso:
  - `PLS` con elenco tracce;
  - `NEXT/PREV` aggiornano `TRACK`.

### T-MAN-007 Shell GN370 principale
- Step:
  1. In `/`, usare comando `LOAD <url.flac>` poi `PLAY`, `STAT`.
- Atteso:
  - comandi player eseguiti anche da shell GN370;
  - output con formato record RC/RSN.

### T-MAN-008 Service Worker no-audio-cache
- Step:
  1. Aprire DevTools > Application > Cache Storage.
  2. Riprodurre file FLAC.
  3. Verificare entry cache.
- Atteso:
  - asset player presenti in static cache;
  - payload `.flac` assenti.

## 6. Criteri di accettazione
- 100% test automatizzati in PASS.
- Nessun comando player produce output non deterministico.
- Reiezione rigorosa non-FLAC confermata.
- Nessuna regressione su shell GN370 esistente.
- Politica no-audio-cache verificata.

## 7. Evidenze da raccogliere
- output console test (`npm run test:player`, `npm test`, `npm run test:sql`);
- screenshot `/player/` in stato PLAYING e ERROR NOT_FLAC;
- screenshot cache storage con assenza audio.
