# IMS Transaction: GN37HOME

## 1. Scopo della Transazione

La transazione `GN37HOME` è il punto di ingresso principale (la "HOME") del sistema `GN370`. 
Presenta all'utente una griglia 3x3 che rappresenta i "9 Mondi" genealogici. L'utente può selezionare un mondo tramite tasti funzione (PF) o un comando diretto per iniziare la navigazione o l'analisi in quell'area tematica.

La transazione è progettata per essere puramente "message-driven" in un paradigma IMS/DC classico.

## 2. Naming Convention

| Artefatto        | Nome       | Descrizione                               |
|------------------|------------|-------------------------------------------|
| **Transaction Code** | `GN37HOME` | Codice per avviare la transazione da un terminale IMS. |
| **Program-ID**     | `GN37P001` | Programma COBOL che processa la transazione.  |
| **Mapset**         | `GN37M001` | Mapset MFS contenente la mappa della schermata. |
| **Map**            | `GN37D001` | Mappa MFS per I/O (formato 24x80).         |
| **PSB Name**       | `GN37S001` | PSB del programma `GN37P001`.               |
| **DBD Name**       | `GN37B001` | DBD di riferimento per il PCB del database. |

## 3. Flusso Logico (STEP)

1.  **(ENTRY)** L'utente digita `GN37HOME` sul terminale. Il programma `GN37P001` riceve il controllo per la prima volta (nessun input dall'utente).
2.  **(BUILD-DEFAULT-MAP)** Il programma popola l'area di output della mappa:
    *   Carica le etichette dei 9 mondi (da default o da tabella override).
    *   Imposta il Mondo 5 (`CONTESTO`) come `ATTIVO` (attributo MFS `BRT`).
    *   Popola i campi di sistema (`@SELF@`, `#ROOT#`, `JOB`, `TEMA`).
3.  **(SEND-MSG)** Il programma invia la mappa formattata al terminale usando `CALL 'CBLTDLI'` sull'IOPCB.
4.  **(WAIT-INPUT)** Il programma termina, attendendo l'input dell'utente.
5.  **(USER-ACTION)** L'utente preme un tasto PF (1-10) o inserisce un comando nel campo `CMDIN`.
6.  **(RECEIVE-MSG)** Il programma `GN37P001` riceve di nuovo il controllo con l'input dell'utente nell'area di input della mappa.
7.  **(EDIT-INPUT)** Il programma analizza l'input:
    *   Se è un PF Key valido (1-9), imposta il nuovo `WS-ACTIVE-WORLD`.
    *   Se è `PF10`, esegue la logica "TEMA" (STUB).
    *   Se è un comando in `CMDIN`, lo valida (es. `W5` per selezionare il mondo 5).
    *   Se l'input non è valido, prepara un messaggio di errore.
8.  **(DLI-PATH)** (STUB) In base al mondo selezionato, il programma esegue chiamate DL/I per leggere i dati pertinenti. Per ora, questo step è un placeholder.
9.  **(BUILD-OUTPUT)** Il programma costruisce la mappa di output in base ai dati letti e al nuovo stato (es. cambia il mondo attivo). Se c'è un errore, popola il campo messaggi `MSGDTL`.
10. **(GOTO-SEND)** Il flusso torna al punto 3 per inviare la nuova schermata.

## 4. PF Key Mapping

| Tasto | Funzione                       | Logica Associata                                   |
|-------|--------------------------------|----------------------------------------------------|
| `PF1` | Seleziona `WORLD-1` (ORIGINI)  | Imposta `WS-ACTIVE-WORLD` a 1 e ricarica la mappa. |
| `PF2` | Seleziona `WORLD-2` (CICLI)    | Imposta `WS-ACTIVE-WORLD` a 2 e ricarica la mappa. |
| `PF3` | Seleziona `WORLD-3` (DONI)     | Imposta `WS-ACTIVE-WORLD` a 3 e ricarica la mappa. |
| `PF4` | Seleziona `WORLD-4` (OMBRE)    | Imposta `WS-ACTIVE-WORLD` a 4 e ricarica la mappa. |
| `PF5` | Seleziona `WORLD-5` (CONTESTO) | Imposta `WS-ACTIVE-WORLD` a 5 e ricarica la mappa. |
| `PF6` | Seleziona `WORLD-6` (STRUTTURA)| Imposta `WS-ACTIVE-WORLD` a 6 e ricarica la mappa. |
| `PF7` | Seleziona `WORLD-7` (EREDITÀ)  | Imposta `WS-ACTIVE-WORLD` a 7 e ricarica la mappa. |
| `PF8` | Seleziona `WORLD-8` (NEBBIA)   | Imposta `WS-ACTIVE-WORLD` a 8 e ricarica la mappa. |
| `PF9` | Seleziona `WORLD-9` (RADICI)   | Imposta `WS-ACTIVE-WORLD` a 9 e ricarica la mappa. |
|`PF10` | Seleziona TEMA                 | (STUB) Esegue la logica per cambiare il tema.      |
|`PF11` | Non Usato                      | -                                                  |
|`PF12` | Non Usato                      | -                                                  |

## 5. Sintassi del Campo Comando (CMDIN)

Il campo `CMDIN` permette di selezionare un mondo o eseguire comandi specifici.

| Comando | Esempio | Descrizione                            |
|---------|---------|----------------------------------------|
| `Wn`    | `W1`    | Seleziona il `WORLD-n`. Equivalente a PFn. |
|         | `W9`    | Seleziona il `WORLD-9`.                |
| `HOME`  | `HOME`  | Ricarica la schermata al suo stato di default. |
| `TEMA`  | `TEMA`  | Equivalente a `PF10`.                  |

## 6. Gestione Errori e Return Codes (RC)

- Un input non valido nel campo `CMDIN` o una PF key non gestita non causa un abend della transazione.
- Il programma popola il campo `MSGDTL` sulla mappa con un messaggio di errore (es. `E001: COMANDO NON VALIDO`) e ripresenta la schermata all'utente.
- Gli errori gravi durante le chiamate DL/I (es. status code non previsto) sono gestiti nel paragrafo `8000-ERROR-HANDLING` e dovrebbero produrre un messaggio diagnostico prima di terminare.
