      *================================================================*
      * GN370-CONFLICT-REPORT.cpy  VERSION 1.0                        *
      * Output S4 CONFLICT_DETECT                                      *
      *================================================================*
       01 GN370-CONFLICT-REPORT.
          05 GCR-PIPELINE-ID        PIC X(20).
          05 GCR-INCOMING-XREF      PIC X(30).
          05 GCR-EXISTING-ID        PIC X(12).
          05 GCR-CONFLICT-TYPE      PIC X(20).
          05 GCR-SIMILARITY-SCORE   PIC 9(03).
          05 GCR-SEVERITY           PIC X(08).
             88 GCR-HIGH            VALUE "HIGH".
             88 GCR-MEDIUM          VALUE "MEDIUM".
             88 GCR-LOW             VALUE "LOW".
             88 GCR-NONE            VALUE "NONE".
          05 GCR-CONFLICT-FIELDS    OCCURS 10 TIMES.
             10 GCR-FIELD-NAME      PIC X(30).
             10 GCR-FIELD-INCOMING  PIC X(200).
             10 GCR-FIELD-EXISTING  PIC X(200).
          05 GCR-FIELD-COUNT        PIC 9(02).
          05 GCR-RESOLUTION         PIC X(10).
             88 GCR-ACCEPT-NEW      VALUE "ACCEPT_NEW".
             88 GCR-KEEP-EXIST      VALUE "KEEP_EXIST".
             88 GCR-MERGE           VALUE "MERGE".
             88 GCR-SKIP            VALUE "SKIP".
             88 GCR-PENDING-USER    VALUE "PENDING".
          05 GCR-RESOLVE-TS         PIC X(14).
          05 GCR-RESOLVE-BY         PIC X(20).
