# Piano di Test Deterministico: Transazione GN37HOME

Questo documento definisce i casi di test minimi per verificare il comportamento della transazione `GN37HOME` in modo deterministico.

---

### Test Case 1: Primo Ingresso (First Entry)

*   **Scopo:** Verificare che la transazione visualizzi correttamente la schermata iniziale al primo avvio.
*   **Input:** L'utente inserisce il codice transazione `GN37HOME` su un terminale vuoto.
*   **Output Atteso:**
    1.  Il programma `GN37P001` invia la mappa `GN37D001` al terminale.
    2.  Tutte le etichette dei 9 mondi (`W1LBL` a `W9LBL`) sono popolate con i loro valori di default ("ORIGINI", "CICLI", ecc.).
    3.  Il campo `W5LBL` ("CONTESTO") e la sua descrizione associata hanno l'attributo `BRT` (alta intensità). Tutti gli altri 8 mondi hanno l'attributo `NORM`.
    4.  Il campo `CMDIN` è vuoto e posizionato in `(2,48)`.
    5.  I campi del footer (`SELFDSP`, `JOBSTAT`, `THEMEDISP`) contengono i loro valori di default (`@USERID`, `IDLE`, `TEMA-CORRENTE`).
    6.  Il campo `MSGDTL` è vuoto.

---

### Test Case 2: Selezione Mondo tramite PF Key

*   **Scopo:** Verificare che la pressione di un tasto PF (1-9) cambi correttamente il mondo attivo.
*   **Input:** Dalla schermata iniziale, l'utente preme il tasto `PF1`.
*   **Output Atteso:**
    1.  La mappa `GN37D001` viene ripresentata.
    2.  Il campo `W1LBL` ("ORIGINI") e la sua descrizione ora hanno l'attributo `BRT`.
    3.  Tutti gli altri mondi, incluso `W5LBL`, ora hanno l'attributo `NORM`.
    4.  (Logica futura) Il programma esegue il `PATH` logico associato al Mondo 1 (STUB).
    5.  Il resto della schermata rimane invariato.
*   **Variazioni:** Il test deve essere ripetuto per tutte le PF key da `PF1` a `PF9`, verificando che il mondo attivo corretto venga evidenziato.

---

### Test Case 3: Selezione Mondo tramite Comando

*   **Scopo:** Verificare che l'inserimento di un comando nel campo `CMDIN` cambi correttamente il mondo attivo.
*   **Input:** Dalla schermata iniziale, l'utente inserisce `W7` nel campo `CMDIN` e preme `ENTER`.
*   **Output Atteso:**
    1.  La mappa `GN37D001` viene ripresentata.
    2.  Il campo `W7LBL` ("EREDITÀ") e la sua descrizione ora hanno l'attributo `BRT`.
    3.  Il campo `CMDIN` viene ripresentato vuoto.
    4.  Tutti gli altri mondi, incluso `W5LBL`, ora hanno l'attributo `NORM`.
*   **Variazioni:** Il test deve essere ripetuto per comandi da `W1` a `W9`.

---

### Test Case 4: Input Invalido

*   **Scopo:** Verificare la robustezza della transazione a fronte di input non validi.
*   **Input:** Dalla schermata iniziale, l'utente inserisce `COMANDO_INESISTENTE` nel campo `CMDIN` e preme `ENTER`.
*   **Output Atteso:**
    1.  La mappa `GN37D001` viene ripresentata senza cambiare lo stato del mondo attivo (`W5LBL` rimane `BRT`).
    2.  Il campo `MSGDTL` contiene il messaggio di errore `E001: COMANDO NON VALIDO.`.
    3.  Il campo `CMDIN` viene ripresentato vuoto.
    4.  La transazione non deve terminare o andare in abend.
*   **Variazioni:** Provare con una PF key non mappata (es. `PF11`). L'output atteso è un messaggio di errore `E002: TASTO PF NON GESTITO.`.

---

### Test Case 5: Dato Mancante (Root Assente)

*   **Scopo:** Verificare che il sistema gestisca in modo pulito l'assenza di dati fondamentali.
*   **Input:** Scenario in cui la logica DL/I (attualmente STUB) non trova il segmento radice (#ROOT#).
*   **Output Atteso:**
    1.  La mappa `GN37D001` viene presentata.
    2.  Il campo `ROOTSYM` (nel riquadro `WORLD-9`) contiene il simbolo di `GAP` (`~`).
    3.  Il campo `ROOTNAM` è vuoto o contiene un testo indicativo come "N/A".
    4.  Il sistema non va in abend ma presenta la schermata con l'indicazione del dato mancante.
