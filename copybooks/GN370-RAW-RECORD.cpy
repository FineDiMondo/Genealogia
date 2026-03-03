      *================================================================*
      * GN370-RAW-RECORD.cpy  VERSION 1.0                             *
      * Output S2 MAPPER                                               *
      *================================================================*
       01 GN370-RAW-RECORD.
          05 GRR-PIPELINE-ID       PIC X(20).
          05 GRR-GEDCOM-XREF       PIC X(30).
          05 GRR-RECORD-TYPE       PIC X(10).
          05 GRR-RAW-NAME          PIC X(200).
          05 GRR-RAW-SURNAME       PIC X(80).
          05 GRR-RAW-GIVEN         PIC X(80).
          05 GRR-RAW-SEX           PIC X(02).
          05 GRR-RAW-BIRTH-DATE    PIC X(50).
          05 GRR-RAW-BIRTH-PLACE   PIC X(200).
          05 GRR-RAW-DEATH-DATE    PIC X(50).
          05 GRR-RAW-DEATH-PLACE   PIC X(200).
          05 GRR-RAW-BURIAL-DATE   PIC X(50).
          05 GRR-RAW-BURIAL-PLACE  PIC X(200).
          05 GRR-RAW-TITLE         PIC X(100).
          05 GRR-RAW-OCCU          PIC X(80).
          05 GRR-RAW-RELI          PIC X(40).
          05 GRR-RAW-NOTE          PIC X(2000).
          05 GRR-SOUR-REFS         OCCURS 10 TIMES PIC X(30).
          05 GRR-SOUR-REF-COUNT    PIC 9(02).
          05 GRR-MAPPED-TS         PIC X(14).
          05 GRR-MAP-STATUS        PIC X(01).
             88 GRR-MAP-OK         VALUE "K".
             88 GRR-MAP-WARN       VALUE "W".
             88 GRR-MAP-ERR        VALUE "E".
