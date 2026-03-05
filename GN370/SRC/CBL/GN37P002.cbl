      ******************************************************************
      * PROGRAM-ID: GN37P002
      *
      * DESC: PROGRAMMA COBOL PER TX GN37W01 (MONDO 1 - ORIGINI)
      *
      * AUTH: CODEX AI, 2026-03-05
      *
      * PARADIGM: IMS/DC, MACCHINA A STATI SEQ-ID
      ******************************************************************
       IDENTIFICATION DIVISION.
       PROGRAM-ID. GN37P002.
       
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
      *
      * STRUTTURE DATI MACCHINA A STATI
      *
       77  WS-PROGRAM-DESC    PIC X(24) VALUE 'PROGRAMMA TX: GN37P002'.
       77  WS-SEQ-ID          PIC 9(1)  VALUE 1.
           88  SEQ-IS-ENTRA         VALUE 1.
           88  SEQ-IS-SURVEY        VALUE 2.
           88  SEQ-IS-SELECT        VALUE 3.
           88  SEQ-IS-EXPAND        VALUE 4.
           88  SEQ-IS-FOCUS         VALUE 5.
           88  SEQ-IS-TRACE         VALUE 6.
           88  SEQ-IS-ARRIVE        VALUE 7.
           88  SEQ-IS-REFLECT       VALUE 8.
           88  SEQ-IS-EXPORT        VALUE 9.

       77  W-DLI-FUNC-GU      PIC X(4)  VALUE 'GU  '.
       77  W-DLI-FUNC-ISRT    PIC X(4)  VALUE 'ISRT'.

       01  WS-MAP-IO-AREA       PIC X(1920).
      *
      * COPYBOOKS
      *
       COPY GN37M02.
       COPY GNSYMB.
       COPY ERRMSG.
       COPY HOUSEG.
       COPY TITSEG.

      ******************************************************************
      * LINKAGE SECTION
      ******************************************************************
       LINKAGE SECTION.
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
           PERFORM 2000-RECEIVE-MESSAGE.

           IF IOPCB-STATUS = '  '
              PERFORM 2100-PARSE-COMMAND
              PERFORM 2200-DECODE-PF-KEY
           END-IF.

           PERFORM 3000-SEQUENCE-DISPATCH.
           PERFORM 4000-PERFORM-DLI-CALLS.
           PERFORM 5000-BUILD-OUTPUT-MAP.
           PERFORM 6000-SEND-MESSAGE.
           PERFORM 9999-TERMINATE-PROGRAM.
           GOBACK.

      ******************************************************************
      * 1000 - INIZIALIZZAZIONE
      ******************************************************************
       1000-INITIALIZE-TRANSACTION.
           INITIALIZE GN37D002O.
           SET SEQ-IS-ENTRA TO TRUE.
           .

      ******************************************************************
      * 2000 - RICEZIONE E PARSING
      ******************************************************************
       2000-RECEIVE-MESSAGE.
           CALL 'CBLTDLI' USING W-DLI-FUNC-GU, IOPCB, WS-MAP-IO-AREA.
           IF IOPCB-STATUS NOT = '  '
              MOVE 1 TO WS-SEQ-ID
           END-IF.
           MOVE WS-MAP-IO-AREA TO GN37D002I.
           .
       2100-PARSE-COMMAND.
      *    (STUB) NORMALIZZA E ANALIZZA CMDIN
           IF CMDIN NOT = SPACES
      *        IF CMDIN = "SEQ 5" SET WS-SEQ-ID TO 5
      *        IF CMDIN = "NEXT"  ADD 1 TO WS-SEQ-ID
               CONTINUE
           END-IF.
           .
       2200-DECODE-PF-KEY.
      *    (STUB) ANALIZZA L'AID BYTE PER CAPIRE QUALE PF E' STATO USATO
      *    IF PF6-PRESSED ADD 1 TO WS-SEQ-ID.
      *    IF PF7-PRESSED SUBTRACT 1 FROM WS-SEQ-ID.
      *    IF PF3-PRESSED (MOVE 'GN37HOME' TO LTERM-ID, GO TO 6000).
           .

      ******************************************************************
      * 3000 - DISPATCH DELLA MACCHINA A STATI
      ******************************************************************
       3000-SEQUENCE-DISPATCH.
           EVALUATE TRUE
               WHEN SEQ-IS-ENTRA    PERFORM 3100-SEQ-1-ENTRA
               WHEN SEQ-IS-SURVEY   PERFORM 3200-SEQ-2-SURVEY
               WHEN SEQ-IS-SELECT   PERFORM 3300-SEQ-3-SELECT
               WHEN SEQ-IS-EXPORT   PERFORM 3900-SEQ-9-EXPORT
               WHEN OTHER           PERFORM 8000-ERROR-HANDLER
           END-EVALUATE.
           .
       3100-SEQ-1-ENTRA.
           MOVE "(SEQ:1) ENTRA" TO CANVAS1.
           MOVE "└─ Scegli [WORLD:1] o [PF:1]" TO CANVAS2.
           .
       3200-SEQ-2-SURVEY.
           MOVE "(SEQ:2) SURVEY" TO CANVAS1.
           MOVE "└─ [WORLD:1] mostra 4 casati" TO CANVAS2.
           .
       3300-SEQ-3-SELECT.
           MOVE "(SEQ:3) SELECT" TO CANVAS1.
           MOVE "└─ Click / CMD 'casato...'" TO CANVAS2.
           .
       3900-SEQ-9-EXPORT.
           MOVE "(SEQ:9) EXPORT" TO CANVAS1.
           MOVE "└─ Produce report SYSOUT" TO CANVAS2.
           .

      ******************************************************************
      * 4000 - CHIAMATE DL/I
      ******************************************************************
       4000-PERFORM-DLI-CALLS.
      *    (STUB) ESEGUE CHIAMATE DL/I IN BASE A WS-SEQ-ID
           IF SEQ-IS-SURVEY
      *        CALL 'CBLTDLI' USING 'GN  ', DBPCB, ...
               CONTINUE
           END-IF.
           .

      ******************************************************************
      * 5000 - COSTRUZIONE MAPPA DI OUTPUT
      ******************************************************************
       5000-BUILD-OUTPUT-MAP.
      *    (STUB) AGGIORNA CAMPI MAPPA PRIMA DELL'INVIO
      *    ES: MOVE WS-SEQ-ID TO INFOSTP.
      *    ES: MOVE 'SURVEY' TO INFOACT.
      *    (STUB) IMPOSTA ATTRIBUTO BRT SUL NAVMRK CORRENTE
           .

      ******************************************************************
      * 6000 - INVIO MESSAGGIO
      ******************************************************************
       6000-SEND-MESSAGE.
           MOVE GN37D002O TO WS-MAP-IO-AREA.
           CALL 'CBLTDLI' USING W-DLI-FUNC-ISRT, IOPCB, WS-MAP-IO-AREA.
           .

      ******************************************************************
      * 8000 - GESTIONE ERRORI
      ******************************************************************
       8000-ERROR-HANDLER.
           MOVE E001-INVALID-COMMAND TO CMDIN.
           .
      ******************************************************************
      * 9999 - FINE PROGRAMMA
      ******************************************************************
       9999-TERMINATE-PROGRAM.
           GOBACK.
      *
      * END OF PROGRAM GN37P002
      *
