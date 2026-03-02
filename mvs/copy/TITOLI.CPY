      * ================================================================ *
      * COPY-ID.      TITOLI                                             *
      * DATASET.      GENTIT00.DAT                                       *
      * LRECL.        080                                                *
      * RECFM.        FB                                                 *
      * VERSION.      1.0.0                                              *
      * DATE.         20260302                                           *
      * ================================================================ *
      * OFFSET MAP (1-BASED):
      *   001-008  TIT-ID
      *   009-038  TIT-NOME
      *   039-040  TIT-TIPO
      *   041-050  TIT-REGNO
      *   051-054  TIT-ANNO-INIZ
      *   055-058  TIT-ANNO-FINE
      *   059-066  TIT-IND-ID
      *   067-074  TIT-FONTE
      *   075-080  FILLER
      * ================================================================ *
       01 TITOLI-RECORD.
          05 TIT-ID             PIC X(08).
          05 TIT-NOME           PIC X(30).
          05 TIT-TIPO           PIC X(02).
          05 TIT-REGNO          PIC X(10).
          05 TIT-ANNO-INIZ      PIC 9(04).
          05 TIT-ANNO-FINE      PIC 9(04).
          05 TIT-IND-ID         PIC X(08).
          05 TIT-FONTE          PIC X(08).
          05 FILLER             PIC X(06).
