      * ================================================================ *
      * COPY-ID.      INDIVID                                            *
      * DATASET.      GENIND00.DAT                                       *
      * LRECL.        200                                                *
      * RECFM.        FB                                                 *
      * VERSION.      1.0.0                                              *
      * DATE.         20260302                                           *
      * ================================================================ *
      * OFFSET MAP (1-BASED):
      *   001-008  IND-ID
      *   009-038  IND-COGNOME
      *   039-063  IND-NOME
      *   064-064  IND-SESSO
      *   065-072  IND-NASC-DATA
      *   073-080  IND-NASC-LUOGO-ID
      *   081-081  IND-NASC-TIPO
      *   082-089  IND-MORT-DATA
      *   090-097  IND-MORT-LUOGO-ID
      *   098-098  IND-MORT-TIPO
      *   099-106  IND-PADRE-ID
      *   107-114  IND-MADRE-ID
      *   115-122  IND-FAM-ID
      *   123-130  IND-TITOLO-ID
      *   131-170  IND-NOTE
      *   171-178  IND-FONTE-ID
      *   179-179  IND-FLAG-CAPOST
      *   180-182  IND-ATTENDIB
      *   183-184  IND-GEN-NUM
      *   185-200  FILLER
      * ================================================================ *
       01 INDIVID-RECORD.
          05 IND-ID             PIC X(08).
          05 IND-COGNOME        PIC X(30).
          05 IND-NOME           PIC X(25).
          05 IND-SESSO          PIC X(01).
          05 IND-NASC-DATA      PIC 9(08).
          05 IND-NASC-LUOGO-ID  PIC X(08).
          05 IND-NASC-TIPO      PIC X(01).
          05 IND-MORT-DATA      PIC 9(08).
          05 IND-MORT-LUOGO-ID  PIC X(08).
          05 IND-MORT-TIPO      PIC X(01).
          05 IND-PADRE-ID       PIC X(08).
          05 IND-MADRE-ID       PIC X(08).
          05 IND-FAM-ID         PIC X(08).
          05 IND-TITOLO-ID      PIC X(08).
          05 IND-NOTE           PIC X(40).
          05 IND-FONTE-ID       PIC X(08).
          05 IND-FLAG-CAPOST    PIC X(01).
          05 IND-ATTENDIB       PIC X(03).
          05 IND-GEN-NUM        PIC 9(02).
          05 FILLER             PIC X(16).
