      *****************************************************************
      * GN370-FAMILY.CPY
      *****************************************************************
       01  FAMILY-REC.
           05  FAMILY-ID              PIC X(12).
           05  FAMILY-FATHER-ID       PIC X(12).
           05  FAMILY-MOTHER-ID       PIC X(12).
           05  FAMILY-UNION-DATE      PIC X(10).
           05  FAMILY-UNION-DATE-QUAL PIC X(1).
           05  FAMILY-UNION-PLACE-ID  PIC X(12).
           05  FAMILY-UNION-TYPE      PIC X(2).
           05  FAMILY-DISS-DATE       PIC X(10).
           05  FAMILY-DISS-TYPE       PIC X(2).
           05  FAMILY-NOTES           PIC X(500).
           05  FAMILY-CREATED-AT      PIC X(14).
           05  FAMILY-UPDATED-AT      PIC X(14).
           05  FAMILY-VERSION-SEQ     PIC S9(9) COMP.
           05  FAMILY-CHANGE-SRC      PIC X(8).
           05  FAMILY-IS-DELETED      PIC X(1).