# IMS Transaction: GN37W01 (Mondo 1 - ORIGINI)

## 1. Scopo della Transazione

La transazione `GN37W01` è la schermata operativa per "Mondo 1: ORIGINI". Implementa una macchina a stati sequenziale (9 step) che guida l'utente attraverso l'analisi della linea regia, dei titoli e del destino di un casato. L'interazione avviene tramite tasti funzione (PF) e comandi diretti.

## 2. Macchina a Stati (SEQ ID)

La logica della transazione è governata da una variabile interna, `WS-SEQ-ID`, che può assumere valori da 1 a 9. Ogni valore corrisponde a uno step specifico.

- **SEQ 1: ENTRA**
  - DESC: Punto di ingresso nel mondo. Mostra la descrizione iniziale.
- **SEQ 2: SURVEY**
  - DESC: Elenca i 4 casati principali o più attivi nel contesto corrente.
- **SEQ 3: SELECT**
  - DESC: Attende la selezione di un casato da parte dell'utente tramite comando.
- **SEQ 4: EXPAND**
  - DESC: Mostra i dettagli espansi del casato selezionato (es. titoli, rami).
- **SEQ 5: FOCUS**
  - DESC: Si concentra su una linea genealogica specifica all'interno del casato.
- **SEQ 6: TRACE**
  - DESC: Traccia la linea di successione o un evento chiave attraverso le generazioni.
- **SEQ 7: ARRIVE**
  - DESC: Arriva a un punto di interesse o al personaggio `@SELF@` all'interno della linea.
- **SEQ 8: REFLECT**
  - DESC: Mostra una riflessione o un "insight" generato (STUB).
- **SEQ 9: EXPORT**
  - DESC: Prepara i dati raccolti per l'esportazione in un report (STUB).

## 3. PF Key Mapping

| Tasto | Funzione       | Logica Associata                                              |
|-------|----------------|---------------------------------------------------------------|
| `PF1` | HELP/RE-ENTRY  | Non cambia lo stato `SEQ`. Può mostrare un aiuto contestuale. |
| `PF3` | ESCI MONDO     | Termina la transazione corrente e ritorna a `GN37HOME`.       |
| `PF6` | AVANZA ►       | Incrementa `WS-SEQ-ID` di 1 (si ferma a 9).                   |
| `PF7` | ◄ INDIETRO     | Decrementa `WS-SEQ-ID` di 1 (si ferma a 1).                   |
| `PF9` | TEMA           | Cambia il tema visualizzato nel footer (logica di display).   |

## 4. CMD Grammar (BNF Minimale)

```
<command> ::= <seq_cmd> | <casato_cmd> | <nav_cmd> | <export_cmd>

<seq_cmd>    ::= "SEQ" <whitespace> <digit>
<casato_cmd> ::= "CASATO" <whitespace> <name>
<nav_cmd>    ::= "NEXT" | "PREV"
<export_cmd> ::= "EXPORT"

<digit>      ::= "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
<name>       ::= 1*<char>
<whitespace> ::= 1*" "
```

## 5. DL/I Path di Accesso (STUB)

- **SURVEY (SEQ 2):** Un loop di `GN` sul segmento `TITLE-HOUSE` per leggere 4 record.
- **SELECT (SEQ 3):** Una chiamata `GU` con `SSA` sul segmento `TITLE-HOUSE` usando il nome fornito nel comando `CASATO`.
- **EXPAND/FOCUS/TRACE (SEQ 4-6):** Un loop di `GNP` (Get Next within Parent) per navigare i segmenti figli (es. `PERSON` o `TITLE`) sotto il `TITLE-HOUSE` selezionato.
- **ARRIVE (SEQ 7):** Una chiamata `GU` al segmento `PERSON` con `SSA` sull'ID dell'utente loggato (`@SELF@`).
- **EXPORT (SEQ 9):** Nessuna chiamata DL/I. Prepara un messaggio per lo `SYSOUT`.

## 6. Policy Errori e RC

- **RC 0:** Operazione completata con successo.
- **RC 4:** Input utente non valido (`CMDIN` o PF key) oppure record non trovato (`GU` con status 'GE'). La transazione continua, mostrando un messaggio di errore all'utente sulla mappa.
- **RC 8:** Inconsistenza logica interna (es. `WS-SEQ-ID` fuori range, non dovrebbe accadere). Produce un messaggio di errore specifico.
- **RC 12:** Errore fatale (I/O PCB, status code DL/I non gestito). La transazione termina e scrive un log diagnostico.
