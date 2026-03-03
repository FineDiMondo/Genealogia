      *================================================================*
      * GN370-IMPORT-LOG-FAMILY.cpy  VERSION 1.0                      *
      * Family-partitioned import log (AI normalization memory)        *
      *================================================================*
       01 GN370-IMPORT-LOG-FAMILY.
          05 GIF-FAMILY-KEY        PIC X(40).
          05 GIF-LOG-TS            PIC X(14).
          05 GIF-IMPORT-SESSION    PIC X(20).
          05 GIF-PIPELINE-ID       PIC X(20).
          05 GIF-RECORD-TYPE       PIC X(10).
          05 GIF-GEDCOM-XREF       PIC X(30).
          05 GIF-FINAL-DB-ID       PIC X(12).
          05 GIF-DECISION          PIC X(12).
          05 GIF-AI-APPLIED        PIC X(01).
          05 GIF-AI-CONF           PIC 9(03).
          05 GIF-AI-REASON         PIC X(120).
          05 GIF-NORM-PAYLOAD-JSON PIC X(2048).
