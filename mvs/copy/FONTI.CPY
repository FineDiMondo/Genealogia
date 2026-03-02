      * ================================================================ *
      * COPY-ID.      FONTI                                              *
      * DATASET.      GENFON00.DAT                                       *
      * LRECL.        200                                                *
      * RECFM.        FB                                                 *
      * VERSION.      1.0.0                                              *
      * DATE.         20260302                                           *
      * ================================================================ *
      * OFFSET MAP (1-BASED):
      *   001-008  FON-ID
      *   009-011  FON-TIPO
      *   012-071  FON-TITOLO
      *   072-111  FON-ARCHIVIO
      *   112-115  FON-ANNO
      *   116-175  FON-NOTE
      *   176-200  FILLER
      * ================================================================ *
       01 FONTI-RECORD.
          05 FON-ID             PIC X(08).
          05 FON-TIPO           PIC X(03).
          05 FON-TITOLO         PIC X(60).
          05 FON-ARCHIVIO       PIC X(40).
          05 FON-ANNO           PIC 9(04).
          05 FON-NOTE           PIC X(60).
          05 FILLER             PIC X(25).
