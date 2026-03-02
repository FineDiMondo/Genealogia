       IDENTIFICATION DIVISION.
       PROGRAM-ID. GENCLI.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       COPY "CLIARGS.CPY".
       01 WS-ARGC                 PIC 9(4) VALUE 0.
       01 WS-ARG1                 PIC X(120) VALUE SPACES.
       01 WS-ARG2                 PIC X(120) VALUE SPACES.

       PROCEDURE DIVISION.
       MAIN-ENTRY.
           MOVE 0 TO LK-RETURN-CODE
           MOVE SPACES TO LK-CMD LK-PARAM

           ACCEPT WS-ARGC FROM ARGUMENT-NUMBER
           IF WS-ARGC = 0
             PERFORM SHOW-HELP
             GOBACK
           END-IF

           ACCEPT WS-ARG1 FROM ARGUMENT-VALUE
           MOVE FUNCTION UPPER-CASE(FUNCTION TRIM(WS-ARG1)) TO LK-CMD

           IF WS-ARGC >= 2
             ACCEPT WS-ARG2 FROM ARGUMENT-VALUE
             MOVE FUNCTION TRIM(WS-ARG2) TO LK-PARAM
           END-IF

           EVALUATE LK-CMD
             WHEN "HELP"
               PERFORM SHOW-HELP

             WHEN "COUNT"
               CALL "GENCNT00" USING LK-CLI-ARGS

             WHEN "FIND"
               CALL "GENSRH00" USING LK-CLI-ARGS

             WHEN "REPORT"
               CALL "GENRPT00" USING LK-CLI-ARGS

             WHEN OTHER
               DISPLAY "COMANDO NON RICONOSCIUTO: " FUNCTION TRIM(LK-CMD)
               PERFORM SHOW-HELP
               MOVE 8 TO LK-RETURN-CODE
           END-EVALUATE

           GOBACK.

       SHOW-HELP.
           DISPLAY "GENCLI - COMANDI DISPONIBILI:"
           DISPLAY "  HELP"
           DISPLAY "  COUNT PERSONE|FAMIGLIE|EVENTI"
           DISPLAY "  FIND  <testo>"
           DISPLAY "  REPORT"
           .
