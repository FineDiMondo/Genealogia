      * ================================================================ *
      * COPY-ID.      LUOGHI                                             *
      * DATASET.      GENLUO00.DAT                                       *
      * LRECL.        080                                                *
      * RECFM.        FB                                                 *
      * VERSION.      1.0.0                                              *
      * DATE.         20260302                                           *
      * ================================================================ *
      * OFFSET MAP (1-BASED):
      *   001-008  LUO-ID
      *   009-038  LUO-NOME
      *   039-042  LUO-PROV
      *   043-052  LUO-STATO
      *   053-064  LUO-LAT
      *   065-076  LUO-LON
      *   077-080  FILLER
      * ================================================================ *
       01 LUOGHI-RECORD.
          05 LUO-ID             PIC X(08).
          05 LUO-NOME           PIC X(30).
          05 LUO-PROV           PIC X(04).
          05 LUO-STATO          PIC X(10).
          05 LUO-LAT            PIC X(12).
          05 LUO-LON            PIC X(12).
          05 FILLER             PIC X(04).
