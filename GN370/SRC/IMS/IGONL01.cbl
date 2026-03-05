       IDENTIFICATION DIVISION.
       PROGRAM-ID. IGONL01.
       AUTHOR. GN370.
       INSTALLATION. FINE-DI-MONDO.
       DATE-WRITTEN. 2026-03-05.
       REMARKS. IMS/DC first-page transaction skeleton for GNPG001.

       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       INPUT-OUTPUT SECTION.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       77  WS-RC                 PIC S9(4) COMP VALUE 0.
       77  WS-PROGRAM            PIC X(8) VALUE "IGONL01".
       77  WS-TRANS              PIC X(8) VALUE "GNPG001".
       77  WS-MSG-ID             PIC X(4) VALUE "E000".
       77  WS-SEV                PIC X VALUE "I".
       77  WS-FILE               PIC X(8) VALUE "MAP".
       77  WS-REC-KEY            PIC X(12) VALUE SPACES.
       77  WS-DETAIL             PIC X(24) VALUE "INIT".
       77  WS-ACTION             PIC X(8) VALUE "ENTER".
       77  WS-DLI-FUNC           PIC X(4) VALUE SPACES.
       77  WS-DLI-STAT           PIC X(2) VALUE SPACES.

       05  WS-SW.
           10 WS-ERR-FATAL       PIC X VALUE "N".
              88 ERR-FATAL       VALUE "Y".
           10 WS-FIRST-ENTRY     PIC X VALUE "N".
              88 FIRST-ENTRY     VALUE "Y".

       COPY GN1ERR.
       COPY GN1CTR.
       COPY GN1MIN.
       COPY GN1MOUT.
       COPY GN1PRSN.
       COPY GN1EVNT.
       COPY GN1PLAC.
       COPY GN1TITL.
       COPY GN1ASET.
       COPY GN1RELT.

       01  WS-DLI-FUNCS.
           05 DLI-GU             PIC X(4) VALUE "GU  ".
           05 DLI-GN             PIC X(4) VALUE "GN  ".
           05 DLI-GNP            PIC X(4) VALUE "GNP ".
           05 DLI-ISRT           PIC X(4) VALUE "ISRT".
           05 DLI-REPL           PIC X(4) VALUE "REPL".
           05 DLI-DLET           PIC X(4) VALUE "DLET".

       01  WS-SSA.
           05 WS-SSA-PERS        PIC X(30)
              VALUE "PERSON  (PERSID=            )".
           05 WS-SSA-EVNT        PIC X(30)
              VALUE "EVENT   (PERSID=            )".

       LINKAGE SECTION.
       COPY GN1PCBS.

       PROCEDURE DIVISION USING IOPCB-MASK DBPCB-MASK.
       MAINLINE.
           PERFORM 1000-INIT
           PERFORM 2000-RECEIVE-MSG
           IF NOT ERR-FATAL
              PERFORM 3000-EDIT-INPUT
           END-IF
           IF NOT ERR-FATAL
              PERFORM 4000-DLI-PATH
              PERFORM 5000-BUILD-OUTPUT
              PERFORM 6000-SEND-MSG
           END-IF
           PERFORM 9999-EOJ
           GOBACK.

       1000-INIT.
           MOVE SPACES TO GN1MAPOUT
           MOVE "#ROOT#" TO MO-ROOTID
           MOVE "=ERA=" TO MO-ERATXT
           MOVE "[PF1 HELP][PF5 NEXT][PF7 PREV][PF3 EXIT][PF12 RESET]"
             TO MO-PFINFO
           MOVE "E000" TO WS-MSG-ID
           MOVE GN1-SEV-I TO WS-SEV
           MOVE "MAP" TO WS-FILE
           MOVE "INIT OK" TO WS-DETAIL
           PERFORM 8100-BUILD-MSG
           EXIT.

       2000-RECEIVE-MSG.
           MOVE DLI-GU TO WS-DLI-FUNC
           CALL "CBLTDLI" USING WS-DLI-FUNC
                                IOPCB-MASK
                                GN1MAPIN
           ADD 1 TO CT-RECV
           MOVE IO-STATUS TO WS-DLI-STAT
           IF WS-DLI-STAT NOT = SPACES
              MOVE GN1-E901 TO WS-MSG-ID
              MOVE GN1-SEV-F TO WS-SEV
              MOVE "IOPCB" TO WS-FILE
              MOVE "GU MESSAGE FAIL" TO WS-DETAIL
              MOVE 12 TO WS-RC
              PERFORM 8000-ERROR-HANDLING
           END-IF
           IF MI-PFKEY = SPACES AND MI-SELFID = SPACES
              SET FIRST-ENTRY TO TRUE
           END-IF
           EXIT.

       3000-EDIT-INPUT.
           MOVE MI-SELFID TO WS-REC-KEY
           EVALUATE MI-PFKEY
              WHEN "01"
                 MOVE "HELP" TO WS-ACTION
              WHEN "03"
                 MOVE "EXIT" TO WS-ACTION
              WHEN "05"
                 MOVE "NEXT" TO WS-ACTION
              WHEN "06"
                 MOVE "SAVE" TO WS-ACTION
              WHEN "07"
                 MOVE "PREV" TO WS-ACTION
              WHEN "09"
                 MOVE "ADD" TO WS-ACTION
              WHEN "11"
                 MOVE "DEL" TO WS-ACTION
              WHEN "12"
                 MOVE "RESET" TO WS-ACTION
              WHEN SPACES
                 MOVE "ENTER" TO WS-ACTION
              WHEN OTHER
                 MOVE "NOOP" TO WS-ACTION
           END-EVALUATE
           IF WS-ACTION = "NEXT" OR WS-ACTION = "PREV" OR
              WS-ACTION = "SAVE" OR WS-ACTION = "DEL"
              IF MI-SELFID = SPACES
                 MOVE GN1-E201 TO WS-MSG-ID
                 MOVE GN1-SEV-W TO WS-SEV
                 MOVE "MAP" TO WS-FILE
                 MOVE "SELF-ID REQUIRED" TO WS-DETAIL
                 ADD 1 TO CT-SKIP
                 IF WS-RC < 4
                    MOVE 4 TO WS-RC
                 END-IF
                 PERFORM 8000-ERROR-HANDLING
              END-IF
           END-IF
           IF WS-ACTION = "ADD" AND MI-EVTTYP = SPACES
              MOVE GN1-E201 TO WS-MSG-ID
              MOVE GN1-SEV-W TO WS-SEV
              MOVE "MAP" TO WS-FILE
              MOVE "EVENT TYPE REQUIRED" TO WS-DETAIL
              ADD 1 TO CT-SKIP
              IF WS-RC < 4
                 MOVE 4 TO WS-RC
              END-IF
              PERFORM 8000-ERROR-HANDLING
           END-IF
           EXIT.

       4000-DLI-PATH.
           IF WS-RC = 12
              SET ERR-FATAL TO TRUE
           END-IF
           IF ERR-FATAL
              EXIT PARAGRAPH
           END-IF
           EVALUATE WS-ACTION
              WHEN "ENTER"
                 PERFORM 4100-PATH-ENTER
              WHEN "HELP"
                 PERFORM 4110-PATH-HELP
              WHEN "NEXT"
                 PERFORM 4120-PATH-NEXT
              WHEN "PREV"
                 PERFORM 4130-PATH-PREV
              WHEN "EXIT"
                 PERFORM 4140-PATH-EXIT
              WHEN "RESET"
                 PERFORM 4150-PATH-RESET
              WHEN "SAVE"
                 PERFORM 4160-PATH-SAVE
              WHEN "ADD"
                 PERFORM 4170-PATH-ADD
              WHEN "DEL"
                 PERFORM 4180-PATH-DEL
              WHEN OTHER
                 PERFORM 4190-PATH-NOOP
           END-EVALUATE
           EXIT.

       4100-PATH-ENTER.
           MOVE "|PATH| NO-OP ENTER" TO MO-PATHTX
           MOVE "PERSON" TO MO-NODEID
           IF FIRST-ENTRY
              MOVE "FIRST ENTRY PAGE" TO WS-DETAIL
           ELSE
              MOVE "ENTER WITHOUT PF" TO WS-DETAIL
           END-IF
           EXIT.

       4110-PATH-HELP.
           MOVE "|PATH| NO-OP HELP" TO MO-PATHTX
           MOVE "MAP" TO WS-FILE
           MOVE "HELP REQUESTED" TO WS-DETAIL
           EXIT.

       4120-PATH-NEXT.
           MOVE "|PATH| GU PERSON -> GN PERSON -> GN EVENT"
             TO MO-PATHTX
           MOVE "PERSON  (PERSID=            )" TO WS-SSA-PERS
           MOVE MI-SELFID TO WS-SSA-PERS(17:12)
           MOVE DLI-GU TO WS-DLI-FUNC
           CALL "CBLTDLI" USING WS-DLI-FUNC
                                DBPCB-MASK
                                GN1PRSN-SEG
                                WS-SSA-PERS
           ADD 1 TO CT-DLI
           MOVE DB-STATUS TO WS-DLI-STAT
           IF WS-DLI-STAT = SPACES
              MOVE DLI-GN TO WS-DLI-FUNC
              CALL "CBLTDLI" USING WS-DLI-FUNC
                                   DBPCB-MASK
                                   GN1PRSN-SEG
              ADD 1 TO CT-DLI
              MOVE DB-STATUS TO WS-DLI-STAT
           END-IF
           PERFORM 4200-EVAL-PERSON-STATUS
           IF NOT ERR-FATAL AND WS-DLI-STAT = SPACES
              MOVE "EVENT   (PERSID=            )" TO WS-SSA-EVNT
              MOVE PERS-ID TO WS-SSA-EVNT(17:12)
              MOVE DLI-GN TO WS-DLI-FUNC
              CALL "CBLTDLI" USING WS-DLI-FUNC
                                   DBPCB-MASK
                                   GN1EVNT-SEG
                                   WS-SSA-EVNT
              ADD 1 TO CT-DLI
              MOVE DB-STATUS TO WS-DLI-STAT
              PERFORM 4210-EVAL-EVENT-STATUS
           END-IF
           EXIT.

       4130-PATH-PREV.
           MOVE "|PATH| GU PERSON -> GNP PERSON" TO MO-PATHTX
           MOVE "PERSON  (PERSID=            )" TO WS-SSA-PERS
           MOVE MI-SELFID TO WS-SSA-PERS(17:12)
           MOVE DLI-GU TO WS-DLI-FUNC
           CALL "CBLTDLI" USING WS-DLI-FUNC
                                DBPCB-MASK
                                GN1PRSN-SEG
                                WS-SSA-PERS
           ADD 1 TO CT-DLI
           MOVE DB-STATUS TO WS-DLI-STAT
           IF WS-DLI-STAT = SPACES
              MOVE DLI-GNP TO WS-DLI-FUNC
              CALL "CBLTDLI" USING WS-DLI-FUNC
                                   DBPCB-MASK
                                   GN1PRSN-SEG
              ADD 1 TO CT-DLI
              MOVE DB-STATUS TO WS-DLI-STAT
           END-IF
           PERFORM 4200-EVAL-PERSON-STATUS
           EXIT.

       4140-PATH-EXIT.
           MOVE "|PATH| NO-OP EXIT" TO MO-PATHTX
           MOVE "TX EXIT REQUESTED" TO WS-DETAIL
           EXIT.

       4150-PATH-RESET.
           MOVE "|PATH| NO-OP RESET" TO MO-PATHTX
           MOVE SPACES TO MO-SELFID
           MOVE SPACES TO MO-NODEID
           MOVE SPACES TO MO-RELTXT
           MOVE SPACES TO MO-EVTTYP
           MOVE SPACES TO MO-HYPTXT
           MOVE SPACES TO MO-PROPTX
           MOVE SPACES TO MO-TITLET
           MOVE SPACES TO MO-GAPTXT
           MOVE "INPUT RESET" TO WS-DETAIL
           EXIT.

       4160-PATH-SAVE.
           MOVE "|PATH| GU PERSON -> REPL PERSON (STUB)" TO MO-PATHTX
           MOVE GN1-E301 TO WS-MSG-ID
           MOVE GN1-SEV-E TO WS-SEV
           MOVE "DBPCB" TO WS-FILE
           MOVE "SAVE STUB ONLY" TO WS-DETAIL
           IF WS-RC < 8
              MOVE 8 TO WS-RC
           END-IF
           PERFORM 8000-ERROR-HANDLING
           EXIT.

       4170-PATH-ADD.
           MOVE "|PATH| GU PERSON -> ISRT EVENT (STUB)" TO MO-PATHTX
           MOVE GN1-E301 TO WS-MSG-ID
           MOVE GN1-SEV-E TO WS-SEV
           MOVE "DBPCB" TO WS-FILE
           MOVE "ADD STUB ONLY" TO WS-DETAIL
           IF WS-RC < 8
              MOVE 8 TO WS-RC
           END-IF
           PERFORM 8000-ERROR-HANDLING
           EXIT.

       4180-PATH-DEL.
           MOVE "|PATH| GU PERSON -> DLET PERSON (STUB)" TO MO-PATHTX
           MOVE GN1-E301 TO WS-MSG-ID
           MOVE GN1-SEV-E TO WS-SEV
           MOVE "DBPCB" TO WS-FILE
           MOVE "DELETE STUB ONLY" TO WS-DETAIL
           IF WS-RC < 8
              MOVE 8 TO WS-RC
           END-IF
           PERFORM 8000-ERROR-HANDLING
           EXIT.

       4190-PATH-NOOP.
           MOVE "|PATH| NO-OP UNKNOWN PF" TO MO-PATHTX
           MOVE GN1-E301 TO WS-MSG-ID
           MOVE GN1-SEV-E TO WS-SEV
           MOVE "MAP" TO WS-FILE
           MOVE "PF NOT DEFINED" TO WS-DETAIL
           IF WS-RC < 8
              MOVE 8 TO WS-RC
           END-IF
           PERFORM 8000-ERROR-HANDLING
           EXIT.

       4200-EVAL-PERSON-STATUS.
           IF WS-DLI-STAT = SPACES
              MOVE PERS-ID TO MO-SELFID
              MOVE PERS-ROOT TO MO-ROOTID
              MOVE "PERSON" TO MO-NODEID
              MOVE MI-RELTXT TO MO-RELTXT
              MOVE DB-KEY-FBK TO MO-PCBPOS
              MOVE "NEXT/PREV OK" TO WS-DETAIL
           ELSE
              IF WS-DLI-STAT = "GE"
                 MOVE "~GAP~" TO MO-GAPTXT
                 MOVE GN1-E201 TO WS-MSG-ID
                 MOVE GN1-SEV-W TO WS-SEV
                 MOVE "DBPCB" TO WS-FILE
                 MOVE "PERSON GAP" TO WS-DETAIL
                 IF WS-RC < 4
                    MOVE 4 TO WS-RC
                 END-IF
                 PERFORM 8000-ERROR-HANDLING
              ELSE
                 MOVE GN1-E901 TO WS-MSG-ID
                 MOVE GN1-SEV-F TO WS-SEV
                 MOVE "DBPCB" TO WS-FILE
                 MOVE "PERSON STATUS FAIL" TO WS-DETAIL
                 MOVE 12 TO WS-RC
                 PERFORM 8000-ERROR-HANDLING
              END-IF
           END-IF
           EXIT.

       4210-EVAL-EVENT-STATUS.
           IF WS-DLI-STAT = SPACES
              MOVE EVNT-TYPE TO MO-EVTTYP
           ELSE
              IF WS-DLI-STAT = "GE"
                 MOVE "~GAP~" TO MO-GAPTXT
                 MOVE GN1-E201 TO WS-MSG-ID
                 MOVE GN1-SEV-W TO WS-SEV
                 MOVE "DBPCB" TO WS-FILE
                 MOVE "EVENT GAP" TO WS-DETAIL
                 IF WS-RC < 4
                    MOVE 4 TO WS-RC
                 END-IF
                 PERFORM 8000-ERROR-HANDLING
              ELSE
                 MOVE GN1-E901 TO WS-MSG-ID
                 MOVE GN1-SEV-F TO WS-SEV
                 MOVE "DBPCB" TO WS-FILE
                 MOVE "EVENT STATUS FAIL" TO WS-DETAIL
                 MOVE 12 TO WS-RC
                 PERFORM 8000-ERROR-HANDLING
              END-IF
           END-IF
           EXIT.

       5000-BUILD-OUTPUT.
           IF MO-SELFID = SPACES
              MOVE MI-SELFID TO MO-SELFID
           END-IF
           IF MO-NODEID = SPACES
              MOVE MI-NODEID TO MO-NODEID
           END-IF
           IF MO-RELTXT = SPACES
              MOVE MI-RELTXT TO MO-RELTXT
           END-IF
           IF MO-EVTTYP = SPACES
              MOVE MI-EVTTYP TO MO-EVTTYP
           END-IF
           IF MO-HYPTXT = SPACES
              MOVE MI-HYPTXT TO MO-HYPTXT
           END-IF
           IF MO-PROPTX = SPACES
              MOVE MI-PROPTX TO MO-PROPTX
           END-IF
           IF MO-TITLET = SPACES
              MOVE MI-TITLET TO MO-TITLET
           END-IF
           IF MO-ROOTID = SPACES
              MOVE "#ROOT#" TO MO-ROOTID
           END-IF
           IF MO-PCBPOS = SPACES
              MOVE DB-KEY-FBK TO MO-PCBPOS
           END-IF
           PERFORM 8100-BUILD-MSG
           EXIT.

       6000-SEND-MSG.
           MOVE DLI-ISRT TO WS-DLI-FUNC
           CALL "CBLTDLI" USING WS-DLI-FUNC
                                IOPCB-MASK
                                GN1MAPOUT
           ADD 1 TO CT-SEND
           MOVE IO-STATUS TO WS-DLI-STAT
           IF WS-DLI-STAT NOT = SPACES
              MOVE GN1-E901 TO WS-MSG-ID
              MOVE GN1-SEV-F TO WS-SEV
              MOVE "IOPCB" TO WS-FILE
              MOVE "ISRT MESSAGE FAIL" TO WS-DETAIL
              MOVE 12 TO WS-RC
              PERFORM 8000-ERROR-HANDLING
           END-IF
           EXIT.

       8000-ERROR-HANDLING.
           ADD 1 TO CT-ERR
           IF WS-SEV = GN1-SEV-F
              SET ERR-FATAL TO TRUE
           END-IF
           PERFORM 8100-BUILD-MSG
           EXIT.

       8100-BUILD-MSG.
           IF WS-REC-KEY = SPACES
              MOVE MI-SELFID TO WS-REC-KEY
           END-IF
           MOVE SPACES TO MO-MSGTXT
           STRING "GN370 "
                  WS-PROGRAM
                  " "
                  WS-MSG-ID
                  " "
                  WS-SEV
                  " "
                  WS-FILE
                  " "
                  WS-REC-KEY
                  " "
                  WS-DETAIL
             DELIMITED BY SIZE
             INTO MO-MSGTXT
           END-STRING
           EXIT.

       9999-EOJ.
           IF WS-RC = 0 AND CT-ERR > 0
              MOVE 4 TO WS-RC
           END-IF
           MOVE WS-RC TO RETURN-CODE
           EXIT.
