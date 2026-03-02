      * COPY TX2 LLM I/O
       01 TX2-LLM-IO.
          05 IN-AZIONE-LLM             PIC X(16).
          05 IN-TESTO-RICHIESTA        PIC X(1024).
          05 IN-ENTITA-OBIETTIVO       PIC X(32).
          05 OUT-COD-ESITO             PIC 9(4).
          05 OUT-MSG-ESITO             PIC X(120).
          05 OUT-NUM-RISULTATI         PIC 9(4).
