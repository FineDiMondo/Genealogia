      *****************************************************************
      * GN1PRSN - SEGMENTO PERSON (STUB)
      *****************************************************************
       01  GN1PRSN-SEG.
      * PERSON-ID chiave logica minima
           05 PERS-ID               PIC X(12).
      * Nome visualizzato in prima pagina
           05 PERS-NAME             PIC X(40).
      * Genere placeholder
           05 PERS-GEND             PIC X(1).
      * Data nascita YYYY-MM-DD
           05 PERS-BDATE            PIC X(10).
      * ROOT-ID di appartenenza
           05 PERS-ROOT             PIC X(12).
      * Spazio riservato
           05 PERS-FILL             PIC X(181).
