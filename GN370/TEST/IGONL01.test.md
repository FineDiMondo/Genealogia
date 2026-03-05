# IGONL01 deterministic tests (IMS/DC)

## Scope
- Transazione: `GNPG001`
- Programma: `IGONL01`
- MAPSET: `GN1MAPS`
- Obiettivo: validare comportamento deterministico della prima pagina STUB.

## Caso 1 - Primo ingresso (nessun input)
- Input PF/campi:
  - `MI-PFKEY = SPACES`
  - `MI-SELFID = SPACES`
- DL/I path atteso:
  - `GU` su `IOPCB` (receive)
  - `|PATH| NO-OP ENTER`
  - `ISRT` su `IOPCB` (send)
- Output map atteso:
  - `MO-PATHTX = "|PATH| NO-OP ENTER"`
  - `MO-ROOTID = "#ROOT#"`
  - `MO-MSGTXT` con `GN370 IGONL01 E000 I MAP`
  - `RC = 0`

## Caso 2 - PF HELP
- Input PF/campi:
  - `MI-PFKEY = "01"`
  - altri campi opzionali/spazi
- DL/I path atteso:
  - `GU` su `IOPCB`
  - `|PATH| NO-OP HELP`
  - `ISRT` su `IOPCB`
- Output map atteso:
  - `MO-PATHTX = "|PATH| NO-OP HELP"`
  - `MO-PFINFO` valorizzato
  - `RC = 0`

## Caso 3 - PF NEXT (navigazione GN)
- Input PF/campi:
  - `MI-PFKEY = "05"`
  - `MI-SELFID = "P00000000001"`
- DL/I path atteso:
  - `GU IOPCB`
  - `GU PERSON`
  - `GN PERSON`
  - `GN EVENT`
  - `ISRT IOPCB`
- Output map atteso:
  - `MO-PATHTX = "|PATH| GU PERSON -> GN PERSON -> GN EVENT"`
  - `MO-NODEID = "PERSON"`
  - `MO-SELFID` valorizzato da segmento PERSON o input
  - `RC = 0` (oppure `RC = 4` se `EVENT` assente -> `~GAP~`)

## Caso 4 - Input invalido (chiave vuota)
- Input PF/campi:
  - `MI-PFKEY = "05"`
  - `MI-SELFID = SPACES`
- DL/I path atteso:
  - `GU IOPCB`
  - validazione blocca path DB
  - `ISRT IOPCB`
- Output map atteso:
  - `MO-MSGTXT` con `GN370 IGONL01 E201 W MAP`
  - dettaglio `SELF-ID REQUIRED`
  - `RC = 4`

## Caso 5 - ~GAP~ segmento mancante
- Input PF/campi:
  - `MI-PFKEY = "05"`
  - `MI-SELFID = "P99999999999"` (placeholder non presente)
- DL/I path atteso:
  - `GU IOPCB`
  - `GU PERSON` con status `GE`
  - nessun crash
  - `ISRT IOPCB`
- Output map atteso:
  - `MO-GAPTXT = "~GAP~"`
  - `MO-MSGTXT` con `GN370 IGONL01 E201 W DBPCB`
  - `RC = 4`

## Note deterministiche
- Nessun timestamp nei messaggi.
- Stessi input => stessa stringa `MO-MSGTXT`, stesso `MO-PATHTX`, stesso RC.
