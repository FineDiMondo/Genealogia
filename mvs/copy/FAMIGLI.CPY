      * ================================================================ *
      * COPY-ID.      FAMIGLI                                            *
      * DATASET.      GENFAM00.DAT                                       *
      * LRECL.        120                                                *
      * RECFM.        FB                                                 *
      * VERSION.      1.0.0                                              *
      * DATE.         20260302                                           *
      * ================================================================ *
      * OFFSET MAP (1-BASED):
      *   001-008  FAM-ID
      *   009-016  FAM-MARITO
      *   017-024  FAM-MOGLIE
      *   025-032  FAM-MATR-DATA
      *   033-062  FAM-MATR-LUOGO
      *   063-063  FAM-MATR-TIPO
      *   064-071  FAM-SEPAR-DATA
      *   072-101  FAM-NOTE
      *   102-120  FILLER
      * ================================================================ *
       01 FAMIGLI-RECORD.
          05 FAM-ID             PIC X(08).
          05 FAM-MARITO         PIC X(08).
          05 FAM-MOGLIE         PIC X(08).
          05 FAM-MATR-DATA      PIC 9(08).
          05 FAM-MATR-LUOGO     PIC X(30).
          05 FAM-MATR-TIPO      PIC X(01).
          05 FAM-SEPAR-DATA     PIC 9(08).
          05 FAM-NOTE           PIC X(30).
          05 FILLER             PIC X(19).
