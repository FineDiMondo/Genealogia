# DTF PLAYER FLAC (GN370)

## 1. Identificazione documento
- Documento: DTF_PLAYER_FLAC
- Versione: 1.0.0
- Baseline software: GN370 `2.1.0`
- Data: 2026-03-03
- Ambito: modulo PLAYER FLAC client-side, integrato in shell GN370 e pagina `/player/`

## 2. Scope
Implementare un player audio **solo FLAC** senza backend, con:
- comandi shell testuali deterministici;
- stato esplicito e reason codes;
- log in memoria (persistenza opzionale localStorage);
- UI ASCII/monospace stile 3270;
- compatibilita browser desktop/mobile moderni.

### 2.1 Out of scope
- streaming adattivo;
- playlist remote da backend;
- supporto formati diversi da FLAC;
- autoplay implicito.

## 3. Requisiti Funzionali (RF)
- RF-001: accettare esclusivamente sorgenti `.flac` o MIME `audio/flac` / `audio/x-flac`.
- RF-002: esporre i comandi: `PLS`, `LOAD`, `PLAY`, `PAUSE`, `STOP`, `SEEK`, `NEXT`, `PREV`, `STAT`, `HELP`.
- RF-003: ogni comando deve produrre record deterministico `RC/RSN/...`.
- RF-004: stato macchina esplicito (`IDLE`, `LOADED`, `PLAYING`, `PAUSED`, `STOPPED`, `ERROR`).
- RF-005: logging command buffer con timestamp e persistenza opzionale.
- RF-006: pagina `/player/` con campi `FILE`, `STATE`, `TIME`, `DURATION`, `SR/BIT/CH`, `VOL`.
- RF-007: nessun autoplay, nessun side effect non auditabile.

## 4. Requisiti Non Funzionali (RNF)
- RNF-001: nessun backend, runtime statico browser-side.
- RNF-002: dipendenze leggere (nessun framework UI pesante).
- RNF-003: determinismo output shell (record key/value stabile).
- RNF-004: compatibilita offline UI/assets tramite Service Worker.
- RNF-005: policy esplicita `NO_AUDIO_CACHE` per payload FLAC.

## 5. Modello di stato
Stati principali:
- `IDLE`: nessuna traccia attiva.
- `LOADED`: traccia valida FLAC caricata, non in riproduzione.
- `PLAYING`: riproduzione in corso.
- `PAUSED`: riproduzione sospesa, posizione conservata.
- `STOPPED`: riproduzione arrestata, posizione a 0.
- `ERROR`: ultimo comando fallito (RC>=8).

Transizioni principali:
- `IDLE -> LOADED` su `LOAD` valido.
- `LOADED/PAUSED/STOPPED -> PLAYING` su `PLAY`.
- `PLAYING -> PAUSED` su `PAUSE`.
- `PLAYING/PAUSED/LOADED -> STOPPED` su `STOP`.
- `* -> ERROR` su errore comando/engine.

## 6. Return/Reason codes
### 6.1 RC
- `0` OK
- `4` WARN
- `8` ERROR
- `12` FATAL

### 6.2 RSN
- `0` NONE
- `1001` NOT_FLAC
- `1002` LOAD_FAIL
- `1003` DECODE_FAIL
- `1004` UNSUPPORTED
- `1005` BAD_CMD
- `1006` BAD_ARG
- `1007` OUT_OF_RANGE
- `1008` EMPTY_LIST

## 7. Architettura tecnica
Componenti:
- `player/commands-core.js`: parsing/validazione FLAC/format record RC-RSN (riusabile anche da test Node).
- `player/state.js`: stato runtime e log buffer (con localStorage opzionale).
- `player/engine_web.js`: engine audio web.
  - Tentativo 1: `<audio>` con supporto FLAC nativo.
  - Tentativo 2: fallback WebAudio decode path (`decodeAudioData`) + playback node.
- `player/commands.js`: orchestrazione comandi shell -> state/engine.
- `player/player.js`: controller UI della pagina `/player/`.

Integrazione GN370:
- script player caricati anche in `index.html` per comandi shell globali;
- router shell GN370 esteso con comandi player e comando `player` (navigazione a `/player/`);
- link interno in home panel GN370 verso modulo player.

## 8. Service Worker e caching policy
Aggiornamenti SW:
- pre-cache degli asset UI player (`/player/index.html`, js/css player);
- incremento cache name (`gn370-static-v4`);
- regola esplicita `NO_AUDIO_CACHE`:
  - richieste audio o path `.flac` bypassano cache e vanno sempre a rete/file source (`fetch no-store`).

Razionale:
- evitare crescita cache non controllata;
- mantenere tracciabilita e comportamento deterministico sui contenuti multimediali.

## 9. Sicurezza e storage
- Nessun upload server-side.
- File locali gestiti via File API e object URL runtime.
- Persistenza limitata al log comandi (`GN370_PLAYER_LOG`) in localStorage.
- Nessun salvataggio binario audio in localStorage o SW cache.

## 10. Piano test (sintesi)
- Unit test parser/validazione FLAC/record format (`tests/player_commands.test.js`).
- Test manuali UI + shell player documentati in `TEST_PLAN.md`.
- Verifica regressione gate/boot GN370 invariata.

## 11. Piano rilascio
1. Merge codice + docs + test player.
2. Esecuzione smoke: `npm run test:player`, `npm test`, `npm run test:sql`.
3. Verifica UI `/player/` e shell `LOAD/PLAY/STAT`.
4. Publish con `version.json` aggiornato.

## 12. Limitazioni note
- In ambienti browser senza decoder FLAC disponibile in `<audio>` o WebAudio decode, il modulo ritorna `RC=8 RSN=1004/1003`.
- `BIT` puo risultare `0` quando metadata bit-depth non esposto dalla piattaforma.
