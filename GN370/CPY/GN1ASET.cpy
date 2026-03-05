      *****************************************************************
      * GN1ASET - SEGMENTO ASSET (STUB)
      *****************************************************************
       01  GN1ASET-SEG.
      * ASSET-ID chiave logica minima
           05 ASET-ID               PIC X(12).
      * $PROP$ tipo proprieta/asset
           05 ASET-TYPE             PIC X(20).
      * FK verso persona
           05 ASET-PERS             PIC X(12).
      * Spazio riservato
           05 ASET-FILL             PIC X(52).
