      *****************************************************************
      * GN1TITL - SEGMENTO TITLE (STUB)
      *****************************************************************
       01  GN1TITL-SEG.
      * TITLE-ID chiave logica minima
           05 TITL-ID               PIC X(12).
      * ^TITLE^ titolo/rango
           05 TITL-NAME             PIC X(20).
      * FK verso persona
           05 TITL-PERS             PIC X(12).
      * Spazio riservato
           05 TITL-FILL             PIC X(52).
