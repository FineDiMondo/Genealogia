# RELEASE NOTES - PLAYER FLAC

## Release
- Prodotto: GN370
- Versione: `2.1.0`
- Data: 2026-03-03
- Tipo: Minor feature release

## Nuove funzionalita
1. Modulo `PLAYER FLAC` dedicato in `/player/`.
2. Comandi shell player in GN370:
   - `PLS`, `LOAD`, `PLAY`, `PAUSE`, `STOP`, `SEEK`, `NEXT`, `PREV`, `STAT`, `HELP`.
3. Engine audio web con doppio percorso:
   - `<audio>` se FLAC supportato nativamente.
   - fallback WebAudio decode path.
4. Logging command buffer con timestamp e persistenza opzionale localStorage.
5. Output command record deterministico con RC/RSN.

## Modifiche infrastrutturali
- Service Worker aggiornato:
  - pre-cache assets modulo player;
  - policy esplicita no-cache per audio FLAC.

## Versioning
- `version.json`: `2.0.0` -> `2.1.0`
- `build_ts` aggiornato.

## File principali introdotti
- `player/index.html`
- `player/styles.css`
- `player/commands-core.js`
- `player/state.js`
- `player/engine_web.js`
- `player/commands.js`
- `player/player.js`
- `docs/player-flac/DTF_PLAYER_FLAC.md`
- `docs/player-flac/INTERFACE_CONTRACT.md`
- `docs/player-flac/TEST_PLAN.md`
- `docs/player-flac/RELEASE_NOTES.md`
- `tests/player_commands.test.js`

## File principali aggiornati
- `index.html`
- `assets/js/router.js`
- `assets/js/man.js`
- `assets/js/render.js`
- `service-worker.js`
- `package.json`
- `version.json`

## Compatibilita e migrazione
- Nessuna migrazione dati DB richiesta.
- Nessun backend nuovo richiesto.
- Per usare il player: aprire `/player/` o comando shell `player` da home GN370.

## Upgrade path
1. Pull ultima versione repo.
2. `npm install`.
3. `npm run test:player`.
4. `npm test`.
5. `npm run serve` e verifica manuale `/player/`.

## Note operative
- Il modulo rifiuta qualsiasi input non FLAC (`RC=8 RSN=1001`).
- Se il browser non supporta decodifica FLAC in nessun path, ritorna `UNSUPPORTED/DECODE_FAIL`.
- Nessun file audio viene persistito in cache SW.
