# TX_GNPG001

## Identificativi
- Transaction code: `GNPG001`
- Program-ID: `IGONL01`
- Modalita: IMS/DC (solo IMS, no CICS, no web)
- Stato layout: `STUB` (il blocco utente `PRIMA_PAGINA` non contiene ancora campi definitivi)

## Scopo
- Presentare la prima pagina GN370 in paradigma IMS/DC.
- Eseguire navigazione deterministica su `@SELF@` e mostrare output coerente anche in presenza di `~GAP~`.

## Map
- Input MAPSET/MAP: `GN1MAPS/GN1PAGEI`
- Output MAPSET/MAP: `GN1MAPS/GN1PAGEO`
- Device target: 3270 classico 24x80

## Flusso deterministico (STEP)
1. `(STEP) RECEIVE` -> `2000-RECEIVE-MSG`
2. `(STEP) VALIDATE` -> `3000-EDIT-INPUT`
3. `(STEP) DL/I PATH` -> `4000-DLI-PATH`
4. `(STEP) BUILD` -> `5000-BUILD-OUTPUT`
5. `(STEP) SEND` -> `6000-SEND-MSG`

## PF-Key mapping e PATH DL/I

| PF | Azione | PATH DL/I | Esito |
|---|---|---|---|
| `[PF:1]` | HELP | `|PATH| NO-OP` | Messaggio help su mappa |
| `[PF:3]` | EXIT | `|PATH| NO-OP` | Chiusura logica transazione |
| `[PF:5]` | NEXT | `GU PERSON -> GN PERSON -> GN EVENT` | Naviga al prossimo record |
| `[PF:7]` | PREV | `GU PERSON -> GNP PERSON` | Naviga al record precedente nello stesso parent |
| `[PF:6]` | SAVE (STUB) | `GU PERSON -> REPL PERSON` | Placeholder di aggiornamento |
| `[PF:9]` | ADD (STUB) | `GU PERSON -> ISRT EVENT` | Placeholder inserimento evento |
| `[PF:11]` | DELETE (STUB) | `GU PERSON -> DLET PERSON` | Placeholder cancellazione |
| `[PF:12]` | RESET | `|PATH| NO-OP` | Reset campi input/output |
| altre PF | NON DEFINITA | `|PATH| NO-OP` | `E301` con RC logico |

## Regole legenda applicate
- `@SELF@` -> chiave persona corrente (`MI-SELFID` / `MO-SELFID`)
- `#ROOT#` -> radice gerarchica (`MO-ROOTID`)
- `{NODE}` -> nodo attivo (`MO-NODEID`)
- `<REL>` -> relazione attiva (`MO-RELTXT`)
- `|PATH|` -> tracciato DL/I eseguito (`MO-PATHTX`)
- `~GAP~` -> segmento non trovato (`MO-GAPTXT`)
- `*EVT*` -> tipo evento (`MO-EVTTYP`)
- `?HYP?` -> stato ipotesi (`MO-HYPTXT`)
- `$PROP$` -> asset/proprieta (`MO-PROPTX`)
- `^TITLE^` -> titolo/rango (`MO-TITLET`)
- `=ERA=` -> separatore epoca (`MO-ERATXT`)
- `>ACTIVE<` -> posizione PCB corrente (`MO-PCBPOS`)

## Error handling deterministico

| Codice | Severita | Significato | RC |
|---|---|---|---|
| `E000` | I | OK | 0 |
| `E101` | F | OPEN FAIL (placeholder standard) | 12 |
| `E102` | F | READ FAIL (placeholder standard) | 12 |
| `E103` | F | WRITE FAIL (placeholder standard) | 12 |
| `E201` | W | INPUT INVALIDO o GAP logico | 4 |
| `E301` | E | PF non valida o funzione STUB non disponibile | 8 |
| `E901` | F | Errore interno / DL/I status inatteso | 12 |

Formato messaggio mappa/spool:

`GN370 <PROG> <MSG-ID> <SEV> <FILE> <KEY> <DETAIL>`

## Note STUB
- Le azioni `SAVE/ADD/DELETE` sono definite a livello PATH e skeleton COBOL ma marcate `STUB`.
- Il DBD e un `STUB DBD` e verra raffinato quando il layout reale e il modello DB definitivo saranno forniti.
