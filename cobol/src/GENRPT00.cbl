       IDENTIFICATION DIVISION.
       PROGRAM-ID. GENRPT00.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-RC                   PIC S9(4) COMP VALUE 0.
       01 WS-CLI-ARGS.
          05 WS-CMD               PIC X(16).
          05 WS-PARAM             PIC X(120).
          05 WS-RETURN-CODE       PIC S9(4) COMP.

       LINKAGE SECTION.
       COPY "CLIARGS.CPY".

       PROCEDURE DIVISION USING LK-CLI-ARGS.
       MAIN-LOGIC.
           MOVE 0 TO LK-RETURN-CODE
           DISPLAY "=============================="
           DISPLAY "REPORT GENEALOGIA - COBOL CLI"
           DISPLAY "=============================="

           MOVE "COUNT" TO WS-CMD
           MOVE "PERSONE" TO WS-PARAM
           MOVE 0 TO WS-RETURN-CODE
           CALL "GENCNT00" USING WS-CLI-ARGS
           MOVE WS-RETURN-CODE TO WS-RC
           IF WS-RC > LK-RETURN-CODE
             MOVE WS-RC TO LK-RETURN-CODE
           END-IF

           MOVE "COUNT" TO WS-CMD
           MOVE "FAMIGLIE" TO WS-PARAM
           MOVE 0 TO WS-RETURN-CODE
           CALL "GENCNT00" USING WS-CLI-ARGS
           MOVE WS-RETURN-CODE TO WS-RC
           IF WS-RC > LK-RETURN-CODE
             MOVE WS-RC TO LK-RETURN-CODE
           END-IF

           MOVE "COUNT" TO WS-CMD
           MOVE "EVENTI" TO WS-PARAM
           MOVE 0 TO WS-RETURN-CODE
           CALL "GENCNT00" USING WS-CLI-ARGS
           MOVE WS-RETURN-CODE TO WS-RC
           IF WS-RC > LK-RETURN-CODE
             MOVE WS-RC TO LK-RETURN-CODE
           END-IF

           GOBACK.
