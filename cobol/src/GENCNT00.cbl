       IDENTIFICATION DIVISION.
       PROGRAM-ID. GENCNT00.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT INPUT-FILE ASSIGN TO DYNAMIC WS-FILE
               ORGANIZATION IS LINE SEQUENTIAL.

       DATA DIVISION.
       FILE SECTION.
       FD INPUT-FILE.
       01 INPUT-REC               PIC X(512).

       WORKING-STORAGE SECTION.
       01 WS-EOF                  PIC X VALUE "N".
          88 EOF-YES              VALUE "Y".
       01 WS-CNT                  PIC 9(9) VALUE 0.
       01 WS-FILE                 PIC X(128).
       01 WS-TARGET               PIC X(16).
       01 WS-TARGET-U             PIC X(16).

       LINKAGE SECTION.
       COPY "CLIARGS.CPY".

       PROCEDURE DIVISION USING LK-CLI-ARGS.
       MAIN-LOGIC.
           MOVE 0 TO LK-RETURN-CODE
           MOVE SPACES TO WS-FILE
           MOVE LK-PARAM TO WS-TARGET
           MOVE FUNCTION UPPER-CASE(FUNCTION TRIM(WS-TARGET))
             TO WS-TARGET-U

           EVALUATE WS-TARGET-U
             WHEN "PERSONE"
               MOVE "data/PERSONE.DAT" TO WS-FILE
             WHEN "FAMIGLIE"
               MOVE "data/FAMIGLIE.DAT" TO WS-FILE
             WHEN "EVENTI"
               MOVE "data/EVENTI.DAT" TO WS-FILE
             WHEN OTHER
               DISPLAY "ERRORE: TARGET COUNT NON SUPPORTATO: "
                       FUNCTION TRIM(WS-TARGET)
               MOVE 8 TO LK-RETURN-CODE
               GOBACK
           END-EVALUATE

           MOVE 0 TO WS-CNT
           MOVE "N" TO WS-EOF

           OPEN INPUT INPUT-FILE
           IF LK-RETURN-CODE NOT = 0
             DISPLAY "ERRORE OPEN INPUT SU " FUNCTION TRIM(WS-FILE)
             MOVE 12 TO LK-RETURN-CODE
             GOBACK
           END-IF

           PERFORM UNTIL EOF-YES
             READ INPUT-FILE
               AT END
                 MOVE "Y" TO WS-EOF
               NOT AT END
                 IF INPUT-REC NOT = SPACES
                    AND INPUT-REC(1:1) NOT = "#"
                   ADD 1 TO WS-CNT
                 END-IF
             END-READ
           END-PERFORM

           CLOSE INPUT-FILE
           DISPLAY FUNCTION TRIM(WS-TARGET-U) " = " WS-CNT
           MOVE 0 TO LK-RETURN-CODE
           GOBACK.
