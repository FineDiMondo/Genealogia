      *================================================================*
      * GN370-IMPORT-LOG.cpy  VERSION 1.0                             *
      * Structured per-record import log                               *
      *================================================================*
       01 GN370-IMPORT-LOG.
          05 GIL-LOG-ID            PIC X(20).
          05 GIL-IMPORT-SESSION    PIC X(20).
          05 GIL-PIPELINE-ID       PIC X(20).
          05 GIL-GEDCOM-XREF       PIC X(30).
          05 GIL-RECORD-TYPE       PIC X(10).
          05 GIL-FINAL-DB-ID       PIC X(12).
          05 GIL-STAGES.
             10 GIL-S1-STATUS      PIC X(01).
             10 GIL-S1-TOKENS      PIC 9(04).
             10 GIL-S2-STATUS      PIC X(01).
             10 GIL-S2-WARNINGS    PIC 9(02).
             10 GIL-S3-STATUS      PIC X(01).
             10 GIL-S3-NORM-COUNT  PIC 9(02).
             10 GIL-S3-CONF-AVG    PIC 9(03).
             10 GIL-S4-CONFLICT    PIC X(01).
             10 GIL-S4-SEVERITY    PIC X(08).
             10 GIL-S5-DECISION    PIC X(10).
             10 GIL-S6-WRITTEN     PIC X(01).
          05 GIL-NORM-DETAILS      OCCURS 20 TIMES.
             10 GIL-ND-FIELD       PIC X(30).
             10 GIL-ND-FROM        PIC X(200).
             10 GIL-ND-TO          PIC X(200).
             10 GIL-ND-CONF        PIC 9(03).
             10 GIL-ND-RULE        PIC X(20).
          05 GIL-NORM-DETAIL-CNT   PIC 9(02).
          05 GIL-TAGS-FOUND        OCCURS 30 TIMES PIC X(20).
          05 GIL-TAG-COUNT         PIC 9(02).
          05 GIL-TAGS-UNMAPPED     OCCURS 10 TIMES PIC X(20).
          05 GIL-UNMAPPED-COUNT    PIC 9(02).
          05 GIL-BATCH-RESULTS     OCCURS 5 TIMES.
             10 GIL-BATCH-AGENT    PIC X(20).
             10 GIL-BATCH-STATUS   PIC X(01).
             10 GIL-BATCH-FINDINGS PIC 9(03).
             10 GIL-BATCH-MSG      PIC X(200).
          05 GIL-LOG-TS            PIC X(14).
          05 GIL-LOG-CLOSED        PIC X(01).
             88 GIL-COMPLETE       VALUE "Y".
