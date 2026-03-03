# INTERFACE CONTRACT - PLAYER FLAC

## 1. Contratto shell -> modulo PLAYER

### 1.1 Comandi supportati
- `PLS`
- `LOAD <path|url|uri>`
- `PLAY [index]`
- `PAUSE`
- `STOP`
- `SEEK <sec>`
- `NEXT`
- `PREV`
- `STAT`
- `HELP`

### 1.2 Regole parsing
- Case-insensitive sul comando.
- Tokenizzazione whitespace-based.
- `index` in `PLAY [index]` e `SEEK <sec>` sono numerici.
- `LOAD` richiede input FLAC per estensione o MIME.

## 2. Formato output deterministico
Ogni comando ritorna almeno una riga record:

`RC=<n> RSN=<n> STATE=<name> TRACK=<nn> TIME=<sec> DUR=<sec> SR=<hz> BIT=<n> CH=<n> VOL=<n> FILE=<token> MSG=<token>`

### 2.1 Semantica campi
- `RC`: return code (`0|4|8|12`)
- `RSN`: reason code numerico
- `STATE`: stato player
- `TRACK`: indice traccia corrente (2 digit, 1-based) o `00`
- `TIME`: posizione corrente in secondi
- `DUR`: durata in secondi
- `SR`: sample rate (Hz)
- `BIT`: bit depth (0 se non disponibile)
- `CH`: canali audio
- `VOL`: volume 0..100
- `FILE`: nome/path compatto (tokenizzato)
- `MSG`: esito sintetico (token)

## 3. RC/RSN ufficiali

### 3.1 RC
- `0`: OK
- `4`: WARN
- `8`: ERROR
- `12`: FATAL

### 3.2 RSN
- `0`: NONE
- `1001`: NOT_FLAC
- `1002`: LOAD_FAIL
- `1003`: DECODE_FAIL
- `1004`: UNSUPPORTED
- `1005`: BAD_CMD
- `1006`: BAD_ARG
- `1007`: OUT_OF_RANGE
- `1008`: EMPTY_LIST

## 4. Contratto engine interno

### 4.1 `GN370.PLAYER_ENGINE`
Metodi:
- `init()`
- `canUseHtmlFlac()`
- `registerLocalFile(file)`
- `load(track)`
- `play(sec)`
- `pause()`
- `stop()`
- `seek(sec)`
- `setVolume(percent)`
- `metrics()`
- `status()`

### 4.2 `GN370.PLAYER_STATE`
Metodi principali:
- `snapshot()`
- `setPlaybackMetrics(metrics)`
- `setState(name)`
- `addTrack(track)`
- `setCurrentIndex(index)`
- `nextIndex()`, `prevIndex()`
- `appendLog(entry)`, `readLogs(limit)`

### 4.3 `GN370.PLAYER_COMMANDS`
Metodi:
- `canHandle(rawOrTokens)`
- `execute(raw, options)`
- `helpText`

`execute` ritorna:
```json
{
  "rc": 0,
  "rsn": 0,
  "record": "RC=0 RSN=0 ...",
  "lines": ["RC=0 RSN=0 ...", "..."]
}
```

## 5. Formato log comando
Buffer log:
```json
{
  "ts": "2026-03-03T17:00:00.000Z",
  "cmd": "PLAY",
  "rc": 0,
  "rsn": 0,
  "state": "PLAYING",
  "out": "RC=0 RSN=0 STATE=PLAYING ..."
}
```

Persistenza opzionale in localStorage:
- key: `GN370_PLAYER_LOG`

## 6. Esempi

### 6.1 LOAD valido
Input:
`LOAD ./audio/test.flac`

Output:
`RC=0 RSN=0 STATE=LOADED TRACK=01 TIME=0 DUR=0 SR=0 BIT=0 CH=0 VOL=100 FILE=./audio/test.flac MSG=LOAD_OK`

### 6.2 Formato non consentito
Input:
`LOAD ./audio/test.mp3`

Output:
`RC=8 RSN=1001 STATE=ERROR TRACK=00 TIME=0 DUR=0 SR=0 BIT=0 CH=0 VOL=100 FILE=- MSG=LOAD_FAIL`

### 6.3 SEEK fuori range
Input:
`SEEK 999999`

Output:
`RC=8 RSN=1007 STATE=PAUSED TRACK=01 TIME=12 DUR=301 SR=44100 BIT=0 CH=2 VOL=100 FILE=test.flac MSG=OUT_OF_RANGE`

### 6.4 Playlist vuota
Input:
`PLS`

Output:
`RC=4 RSN=1008 STATE=IDLE TRACK=00 TIME=0 DUR=0 SR=0 BIT=0 CH=0 VOL=100 FILE=- MSG=EMPTY_LIST`
