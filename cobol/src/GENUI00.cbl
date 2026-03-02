       IDENTIFICATION DIVISION.
       PROGRAM-ID. GENUI00.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-CHOICE               PIC X VALUE SPACE.
       01 WS-DUMMY                PIC X(120) VALUE SPACES.
       01 WS-CLI-ARGS.
          05 WS-CMD               PIC X(16).
          05 WS-PARAM             PIC X(120).
          05 WS-RETURN-CODE       PIC S9(4) COMP.

       PROCEDURE DIVISION.
       MAIN-LOOP.
           PERFORM UNTIL WS-CHOICE = "6"
             PERFORM SHOW-MENU
             ACCEPT WS-CHOICE
             EVALUATE WS-CHOICE
               WHEN "1"
                 MOVE "COUNT" TO WS-CMD
                 MOVE "PERSONE" TO WS-PARAM
                 MOVE 0 TO WS-RETURN-CODE
                 CALL "GENCNT00" USING WS-CLI-ARGS
                 PERFORM PAUSE-KEY
               WHEN "2"
                 MOVE "COUNT" TO WS-CMD
                 MOVE "FAMIGLIE" TO WS-PARAM
                 MOVE 0 TO WS-RETURN-CODE
                 CALL "GENCNT00" USING WS-CLI-ARGS
                 PERFORM PAUSE-KEY
               WHEN "3"
                 MOVE "COUNT" TO WS-CMD
                 MOVE "EVENTI" TO WS-PARAM
                 MOVE 0 TO WS-RETURN-CODE
                 CALL "GENCNT00" USING WS-CLI-ARGS
                 PERFORM PAUSE-KEY
               WHEN "4"
                 DISPLAY "Testo da cercare (es. ROSSI): " WITH NO ADVANCING
                 ACCEPT WS-PARAM
                 MOVE "FIND" TO WS-CMD
                 MOVE 0 TO WS-RETURN-CODE
                 CALL "GENSRH00" USING WS-CLI-ARGS
                 PERFORM PAUSE-KEY
               WHEN "5"
                 MOVE "REPORT" TO WS-CMD
                 MOVE SPACES TO WS-PARAM
                 MOVE 0 TO WS-RETURN-CODE
                 CALL "GENRPT00" USING WS-CLI-ARGS
                 PERFORM PAUSE-KEY
               WHEN "6"
                 CONTINUE
               WHEN OTHER
                 DISPLAY "Scelta non valida."
                 PERFORM PAUSE-KEY
             END-EVALUATE
           END-PERFORM

           DISPLAY "Uscita da GENUI00."
           GOBACK.

       SHOW-MENU.
           DISPLAY " "
           DISPLAY "==============================================="
           DISPLAY "  GENUI00 - GENEALOGIA (COBOL TUI)"
           DISPLAY "==============================================="
           DISPLAY "1) Count Persone"
           DISPLAY "2) Count Famiglie"
           DISPLAY "3) Count Eventi"
           DISPLAY "4) Find in Persone"
           DISPLAY "5) Report Completo"
           DISPLAY "6) Esci"
           DISPLAY "Scelta => " WITH NO ADVANCING
           .

       PAUSE-KEY.
           DISPLAY "Premi INVIO per continuare..." WITH NO ADVANCING
           ACCEPT WS-DUMMY
           .
