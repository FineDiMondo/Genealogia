      * COPY TX2 GEDCOM I/O
       01 TX2-GEDCOM-IO.
          05 IN-AZIONE-GEDCOM          PIC X(16).
          05 IN-MODALITA-IMPORT        PIC X(16).
          05 IN-FILTRO-EXPORT          PIC X(64).
          05 IN-NOME-FILE-SORGENTE     PIC X(256).
          05 OUT-COD-ESITO             PIC 9(4).
          05 OUT-MSG-ESITO             PIC X(120).
