       IDENTIFICATION DIVISION.
       PROGRAM-ID. GENSRH00.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT PERSONE-FILE ASSIGN TO "data/PERSONE.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.

       DATA DIVISION.
       FILE SECTION.
       FD PERSONE-FILE.
       01 PERSONE-REC             PIC X(512).

       WORKING-STORAGE SECTION.
       01 WS-EOF                  PIC X VALUE "N".
          88 EOF-YES              VALUE "Y".
       01 WS-SEARCH               PIC X(120).
       01 WS-SEARCH-U             PIC X(120).
       01 WS-LINE-U               PIC X(512).
       01 WS-MATCH-COUNT          PIC 9(9) VALUE 0.
       01 WS-I                    PIC 9(4) VALUE 0.
       01 WS-SEARCH-LEN           PIC 9(4) VALUE 0.
       01 WS-LINE-LEN             PIC 9(4) VALUE 512.
       01 WS-HIT                  PIC X VALUE "N".
          88 WS-HIT-YES           VALUE "Y".

       LINKAGE SECTION.
       COPY "CLIARGS.CPY".

       PROCEDURE DIVISION USING LK-CLI-ARGS.
       MAIN-LOGIC.
           MOVE 0 TO LK-RETURN-CODE
           MOVE FUNCTION TRIM(LK-PARAM) TO WS-SEARCH
           IF WS-SEARCH = SPACES
             DISPLAY "ERRORE: FIND RICHIEDE TESTO"
             MOVE 8 TO LK-RETURN-CODE
             GOBACK
           END-IF

           MOVE FUNCTION UPPER-CASE(WS-SEARCH) TO WS-SEARCH-U
           MOVE FUNCTION LENGTH(FUNCTION TRIM(WS-SEARCH-U)) TO WS-SEARCH-LEN
           MOVE "N" TO WS-EOF
           MOVE 0 TO WS-MATCH-COUNT

           OPEN INPUT PERSONE-FILE
           IF LK-RETURN-CODE NOT = 0
             DISPLAY "ERRORE OPEN INPUT SU data/PERSONE.DAT"
             MOVE 12 TO LK-RETURN-CODE
             GOBACK
           END-IF

           PERFORM UNTIL EOF-YES
             READ PERSONE-FILE
               AT END
                 MOVE "Y" TO WS-EOF
               NOT AT END
                 IF PERSONE-REC(1:1) NOT = "#"
                    AND PERSONE-REC NOT = SPACES
                   MOVE FUNCTION UPPER-CASE(PERSONE-REC) TO WS-LINE-U
                   MOVE "N" TO WS-HIT
                   PERFORM VARYING WS-I FROM 1 BY 1
                     UNTIL WS-I > (WS-LINE-LEN - WS-SEARCH-LEN + 1)
                        OR WS-HIT-YES
                     IF WS-LINE-U(WS-I:WS-SEARCH-LEN) =
                        FUNCTION TRIM(WS-SEARCH-U)
                       MOVE "Y" TO WS-HIT
                     END-IF
                   END-PERFORM
                   IF WS-HIT-YES
                     ADD 1 TO WS-MATCH-COUNT
                     DISPLAY PERSONE-REC
                   END-IF
                 END-IF
             END-READ
           END-PERFORM

           CLOSE PERSONE-FILE
           DISPLAY "MATCH TROVATI: " WS-MATCH-COUNT
           IF WS-MATCH-COUNT = 0
             MOVE 4 TO LK-RETURN-CODE
           ELSE
             MOVE 0 TO LK-RETURN-CODE
           END-IF
           GOBACK.
