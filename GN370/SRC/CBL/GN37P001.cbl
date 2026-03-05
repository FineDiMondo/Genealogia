      ******************************************************************
      * PROGRAM-ID: GN37P001
      *
      * DESC: PROGRAMMA COBOL MESSAGE-DRIVEN PER TRANSAZIONE GN37HOME
      *       SISTEMA GN370.
      *
      * AUTH: CODEX AI, 2026-03-05
      *
      * PARADIGM: IMS/DC, SKELETON DETERMINISTICO
      ******************************************************************
       IDENTIFICATION DIVISION.
       PROGRAM-ID. GN37P001.
       
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
      *
      * STRUTTURE DATI
      *
       77  WS-PROGRAM-DESC    PIC X(24) VALUE 'PROGRAMMA TX: GN37P001'.
       77  WS-ACTIVE-WORLD    PIC 9(1)  VALUE 5.
       77  W-DLI-FUNC-GU      PIC X(4)  VALUE 'GU  '.
       77  W-DLI-FUNC-GN      PIC X(4)  VALUE 'GN  '.
       77  W-DLI-FUNC-ISRT    PIC X(4)  VALUE 'ISRT'.
       77  W-DLI-FUNC-PURG    PIC X(4)  VALUE 'PURG'.

       01  WS-MAP-IO-AREA       PIC X(1920).
      *
      * COPYBOOKS
      *
       COPY GN3HMAP.
       COPY GNLABEL.
       COPY GNSYMB.
       COPY ERRMSG.
       COPY PERSSEG.

      ******************************************************************
      * LINKAGE SECTION
      ******************************************************************
       LINKAGE SECTION.
      *
      * PCB: I/O (PRIMO) E DB (SECONDO)
      *
       01  IOPCB.
           05 LTERM-ID         PIC X(8).
           05 FILLER           PIC X(2).
           05 IOPCB-STATUS     PIC X(2).
           05 FILLER           PIC X(12).

       01  DBPCB.
           05 DBD-NAME         PIC X(8).
           05 SEG-LEVEL        PIC X(2).
           05 DBPCB-STATUS     PIC X(2).
           05 PROC-OPTS        PIC X(4).
           05 FILLER           PIC S9(5) COMP.
           05 SEG-NAME-FB      PIC X(8).
           05 KEY-LEN-FB       PIC S9(5) COMP.
           05 NUM-SENS-SEGS    PIC S9(5) COMP.
           05 KEY-FB-AREA      PIC X(1).

      ******************************************************************
      * PROCEDURE DIVISION
      ******************************************************************
       PROCEDURE DIVISION USING IOPCB, DBPCB.
       MAIN-PROCEDURE.
           PERFORM 1000-INITIALIZE-TRANSACTION.
           PERFORM 2000-RECEIVE-INPUT-MESSAGE.

           IF IOPCB-STATUS = '  '
              PERFORM 3000-EDIT-AND-PROCESS-INPUT
              PERFORM 4000-PERFORM-DLI-PATH-LOGIC
           END-IF.

           PERFORM 5000-BUILD-OUTPUT-MESSAGE.
           PERFORM 6000-SEND-OUTPUT-MESSAGE.
           PERFORM 9999-TERMINATE-PROGRAM.
           GOBACK.

      ******************************************************************
      * 1000 - INIZIALIZZAZIONE
      ******************************************************************
       1000-INITIALIZE-TRANSACTION.
      *     INIZIALIZZA VALORI DI DEFAULT PER LA PRIMA ESECUZIONE
           INITIALIZE GN37D001O.
           MOVE 'IDLE' TO JOBSTAT.
           MOVE 'TEMA-CORRENTE' TO THEMEDISP.
           MOVE '@USERID' TO SELFDSP.
      *     (STUB) CARICA LABEL DA TABELLA O USA DEFAULT
           MOVE "ORIGINI"   TO W1LBL.
           MOVE "CICLI"     TO W2LBL.
           MOVE "DONI"      TO W3LBL.
           MOVE "CONTESTO"  TO W4LBL.
           MOVE "OMBRE"     TO W5LBL.
           MOVE "STRUTTURA" TO W6LBL.
           MOVE "EREDITÀ"   TO W7LBL.
           MOVE "NEBBIA"    TO W8LBL.
           MOVE "RADICI"    TO W9LBL.
           .

      ******************************************************************
      * 2000 - RICEZIONE MESSAGGIO DI INPUT
      ******************************************************************
       2000-RECEIVE-INPUT-MESSAGE.
      *     LEGGE IL MESSAGGIO DALLA CODA IMS (GU)
           CALL 'CBLTDLI' USING W-DLI-FUNC-GU,
                                IOPCB,
                                WS-MAP-IO-AREA.
           MOVE WS-MAP-IO-AREA TO GN37D001I.
           .

      ******************************************************************
      * 3000 - ELABORAZIONE INPUT
      ******************************************************************
       3000-EDIT-AND-PROCESS-INPUT.
      *     (STUB) LOGICA PER ANALIZZARE CMDIN E PF-KEYS
      *     IMPOSTA WS-ACTIVE-WORLD IN BASE ALL'INPUT
           IF CMDIN = 'W1' OR 'W2' OR 'W3' OR 'W4' OR 'W5' OR
              'W6' OR 'W7' OR 'W8' OR 'W9'
      *        (STUB) ESTRAI NUMERO E SETTA WS-ACTIVE-WORLD
               CONTINUE
           ELSE
               MOVE E001-INVALID-COMMAND TO MSGDTL
           END-IF.
           .

      ******************************************************************
      * 4000 - LOGICA DI NAVIGAZIONE DATABASE
      ******************************************************************
       4000-PERFORM-DLI-PATH-LOGIC.
      *     (STUB) ESEGUE CHIAMATE DL/I IN BASE A WS-ACTIVE-WORLD
      *     ESEMPIO: LEGGE IL SEGMENTO PERSONA
      *     CALL 'CBLTDLI' USING W-DLI-FUNC-GU,
      *                         DBPCB,
      *                         PERSON-SEGMENT,
      *                         SGA-AREA.
           MOVE '#ROOT#' TO ROOTSYM.
           MOVE 'Pietro' TO ROOTNAM.
           .

      ******************************************************************
      * 5000 - COSTRUZIONE MESSAGGIO DI OUTPUT
      ******************************************************************
       5000-BUILD-OUTPUT-MESSAGE.
      *     (STUB) PREPARA LA MAPPA DI OUTPUT
      *     IMPOSTA ATTRIBUTI PER IL MONDO ATTIVO
           EVALUATE WS-ACTIVE-WORLD
             WHEN 1
      *          (STUB) SETTA W1LBLA = DFHBRT
               CONTINUE
             WHEN 5
      *          (STUB) SETTA W5LBLA = DFHBRT
               CONTINUE
             WHEN OTHER
               CONTINUE
           END-EVALUATE.
           .

      ******************************************************************
      * 6000 - INVIO MESSAGGIO DI OUTPUT
      ******************************************************************
       6000-SEND-OUTPUT-MESSAGE.
      *     INVIA LA MAPPA FORMATTATA AL TERMINALE (ISRT)
           MOVE GN37D001O TO WS-MAP-IO-AREA.
           CALL 'CBLTDLI' USING W-DLI-FUNC-ISRT,
                                IOPCB,
                                WS-MAP-IO-AREA.
           .

      ******************************************************************
      * 8000 - GESTIONE ERRORI
      ******************************************************************
       8000-ERROR-HANDLING.
      *     (STUB) GESTISCE STATUS CODE DL/I NON PREVISTI
           MOVE DBPCB-STATUS TO DLI-ERROR-STATUS.
           MOVE E003-DLI-ERROR TO MSGDTL.
           PERFORM 6000-SEND-OUTPUT-MESSAGE.
           PERFORM 9999-TERMINATE-PROGRAM.
           .

      ******************************************************************
      * 9999 - FINE PROGRAMMA
      ******************************************************************
       9999-TERMINATE-PROGRAM.
           GOBACK.
      *
      * END OF PROGRAM GN37P001
      *
