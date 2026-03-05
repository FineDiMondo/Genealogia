      *****************************************************************
      * GN1EVNT - SEGMENTO EVENT (STUB)
      *****************************************************************
       01  GN1EVNT-SEG.
      * EVENT-ID chiave logica minima
           05 EVNT-ID               PIC X(12).
      * *EVT* tipo evento
           05 EVNT-TYPE             PIC X(12).
      * Data evento YYYY-MM-DD
           05 EVNT-DATE             PIC X(10).
      * FK verso persona
           05 EVNT-PERS             PIC X(12).
      * Spazio riservato
           05 EVNT-FILL             PIC X(114).
