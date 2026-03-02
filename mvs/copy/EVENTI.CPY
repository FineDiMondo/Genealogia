      * ================================================================ *
      * COPY-ID.      EVENTI                                             *
      * DATASET.      GENEVE00.DAT                                       *
      * LRECL.        150                                                *
      * RECFM.        FB                                                 *
      * VERSION.      1.0.0                                              *
      * DATE.         20260302                                           *
      * ================================================================ *
      * OFFSET MAP (1-BASED):
      *   001-008  EVE-ID
      *   009-011  EVE-TIPO
      *   012-019  EVE-DATA
      *   020-020  EVE-DATA-TIPO
      *   021-028  EVE-LUOGO-ID
      *   029-036  EVE-IND-ID
      *   037-044  EVE-FAM-ID
      *   045-104  EVE-DESCR
      *   105-112  EVE-FONTE-ID
      *   113-115  EVE-ATTENDIB
      *   116-150  FILLER
      * ================================================================ *
       01 EVENTI-RECORD.
          05 EVE-ID             PIC X(08).
          05 EVE-TIPO           PIC X(03).
          05 EVE-DATA           PIC 9(08).
          05 EVE-DATA-TIPO      PIC X(01).
          05 EVE-LUOGO-ID       PIC X(08).
          05 EVE-IND-ID         PIC X(08).
          05 EVE-FAM-ID         PIC X(08).
          05 EVE-DESCR          PIC X(60).
          05 EVE-FONTE-ID       PIC X(08).
          05 EVE-ATTENDIB       PIC X(03).
          05 FILLER             PIC X(35).
