      *****************************************************************
      * GN1PCBS - PCB MASK MINIME PER IOPCB E DBPCB
      *****************************************************************
       01  IOPCB-MASK.
           05 IO-LTERM              PIC X(8).
           05 IO-RESV1              PIC X(2).
           05 IO-STATUS             PIC X(2).
           05 IO-DATE               PIC X(4).
           05 IO-TIME               PIC X(4).
           05 IO-SEQ                PIC X(4).

       01  DBPCB-MASK.
           05 DB-DBDNAME            PIC X(8).
           05 DB-SEGLEV             PIC X(2).
           05 DB-STATUS             PIC X(2).
           05 DB-PROCOPT            PIC X(4).
           05 DB-RESV1              PIC X(4).
           05 DB-KEY-FBK            PIC X(12).
