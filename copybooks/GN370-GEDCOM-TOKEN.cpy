      *================================================================*
      * GN370-GEDCOM-TOKEN.cpy  VERSION 1.0                           *
      * Output S1 TOKENIZER                                            *
      *================================================================*
       01 GN370-GEDCOM-TOKEN.
          05 GKT-LINE-NUM         PIC 9(07).
          05 GKT-LEVEL            PIC 9(02).
          05 GKT-XREF             PIC X(30).
          05 GKT-TAG              PIC X(20).
          05 GKT-VALUE            PIC X(2048).
          05 GKT-CONTINUATION     PIC X(01).
             88 GKT-IS-CONT       VALUE "C".
             88 GKT-IS-CONC       VALUE "N".
             88 GKT-NORMAL        VALUE " ".
          05 GKT-PARENT-XREF      PIC X(30).
          05 GKT-PARENT-TAG       PIC X(20).
          05 GKT-GEDCOM-VER       PIC X(08).
          05 GKT-ENCODING         PIC X(08).
          05 GKT-PROC-STATUS      PIC X(01).
             88 GKT-PENDING       VALUE "P".
             88 GKT-PROCESSED     VALUE "D".
             88 GKT-SKIPPED       VALUE "S".
             88 GKT-ERROR         VALUE "E".
