      *****************************************************************
      * GN370-PERSON.CPY
      *****************************************************************
       01  PERSON-REC.
           05  PERSON-ID              PIC X(12).
           05  PERSON-SURNAME         PIC X(60).
           05  PERSON-GIVEN-NAME      PIC X(60).
           05  PERSON-SURNAME-BIRTH   PIC X(60).
           05  PERSON-GENDER          PIC X(1).
           05  PERSON-BIRTH-DATE      PIC X(10).
           05  PERSON-BIRTH-DATE-QUAL PIC X(1).
           05  PERSON-BIRTH-DATE-CAL  PIC X(1).
           05  PERSON-DEATH-DATE      PIC X(10).
           05  PERSON-DEATH-DATE-QUAL PIC X(1).
           05  PERSON-DEATH-CAL       PIC X(1).
           05  PERSON-BIRTH-PLACE-ID  PIC X(12).
           05  PERSON-DEATH-PLACE-ID  PIC X(12).
           05  PERSON-NOTES           PIC X(500).
           05  PERSON-CREATED-AT      PIC X(14).
           05  PERSON-UPDATED-AT      PIC X(14).
           05  PERSON-VERSION-SEQ     PIC S9(9) COMP.
           05  PERSON-CHANGE-SRC      PIC X(8).
           05  PERSON-IS-DELETED      PIC X(1).