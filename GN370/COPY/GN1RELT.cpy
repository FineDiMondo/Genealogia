      *****************************************************************
      * GN1RELT - SEGMENTO RELATE (STUB)
      *****************************************************************
       01  GN1RELT-SEG.
      * REL-ID chiave logica minima
           05 REL-ID                PIC X(12).
      * <REL> tipo relazione
           05 REL-TYPE              PIC X(12).
      * FK persona origine
           05 REL-PERS              PIC X(12).
      * FK persona destinazione
           05 REL-TARG              PIC X(12).
      * Spazio riservato
           05 REL-FILL              PIC X(48).
