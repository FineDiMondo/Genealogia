      *****************************************************************
      * GN370-DB-REC.CPY  (UNION RECORD)
      * RT (Record Type) suggeriti:
      * 'PE' PERSON, 'FA' FAMILY, 'FL' FAMILY_LINK, 'RE' RELATION,
      * 'PL' PLACE, 'EV' EVENT, 'PV' PERSON_EVENT,
      * 'SO' SOURCE, 'CI' CITATION,
      * 'TI' TITLE, 'TA' TITLE_ASSIGNMENT,
      * 'HO' HOUSE, 'PH' PERSON_HOUSE,
      * 'ME' MEDIA, 'ML' MEDIA_LINK,
      * 'JO' JOURNAL
      *****************************************************************

       01  GN370-DB-REC.
           05  GN-RT                 PIC X(2).
           05  GN-PRIMARY-ID         PIC X(12).
           05  GN-REC-VERSION        PIC X(2).
           05  GN-FILLER             PIC X(900).

       01  GN370-DB-REC-X REDEFINES GN370-DB-REC.
           05  GN-HDR.
               10  GNX-RT            PIC X(2).
               10  GNX-PRIMARY-ID    PIC X(12).
               10  GNX-REC-VERSION   PIC X(2).
           05  GN-PAYLOAD.
               10  GN-PERSON   REDEFINES GN-PAYLOAD.
                   15  PERSON-ID              PIC X(12).
                   15  PERSON-SURNAME         PIC X(60).
                   15  PERSON-GIVEN-NAME      PIC X(60).
                   15  PERSON-SURNAME-BIRTH   PIC X(60).
                   15  PERSON-GENDER          PIC X(1).
                   15  PERSON-BIRTH-DATE      PIC X(10).
                   15  PERSON-BIRTH-DATE-QUAL PIC X(1).
                   15  PERSON-BIRTH-DATE-CAL  PIC X(1).
                   15  PERSON-DEATH-DATE      PIC X(10).
                   15  PERSON-DEATH-DATE-QUAL PIC X(1).
                   15  PERSON-DEATH-CAL       PIC X(1).
                   15  PERSON-BIRTH-PLACE-ID  PIC X(12).
                   15  PERSON-DEATH-PLACE-ID  PIC X(12).
                   15  PERSON-NOTES           PIC X(500).
                   15  PERSON-CREATED-AT      PIC X(14).
                   15  PERSON-UPDATED-AT      PIC X(14).
                   15  PERSON-VERSION-SEQ     PIC S9(9) COMP.
                   15  PERSON-CHANGE-SRC      PIC X(8).
                   15  PERSON-IS-DELETED      PIC X(1).
                   15  PERSON-PAD             PIC X(49).

               10  GN-FAMILY   REDEFINES GN-PAYLOAD.
                   15  FAMILY-ID              PIC X(12).
                   15  FAMILY-FATHER-ID       PIC X(12).
                   15  FAMILY-MOTHER-ID       PIC X(12).
                   15  FAMILY-UNION-DATE      PIC X(10).
                   15  FAMILY-UNION-DATE-QUAL PIC X(1).
                   15  FAMILY-UNION-PLACE-ID  PIC X(12).
                   15  FAMILY-UNION-TYPE      PIC X(2).
                   15  FAMILY-DISS-DATE       PIC X(10).
                   15  FAMILY-DISS-TYPE       PIC X(2).
                   15  FAMILY-NOTES           PIC X(500).
                   15  FAMILY-CREATED-AT      PIC X(14).
                   15  FAMILY-UPDATED-AT      PIC X(14).
                   15  FAMILY-VERSION-SEQ     PIC S9(9) COMP.
                   15  FAMILY-CHANGE-SRC      PIC X(8).
                   15  FAMILY-IS-DELETED      PIC X(1).
                   15  FAMILY-PAD             PIC X(69).

               10  GN-PLACE    REDEFINES GN-PAYLOAD.
                   15  PLACE-ID               PIC X(12).
                   15  PLACE-NAME             PIC X(100).
                   15  PLACE-ALT-NAME         PIC X(100).
                   15  PLACE-GEO-LEVEL        PIC X(15).
                   15  PLACE-PARENT-ID        PIC X(12).
                   15  PLACE-LATITUDE         PIC X(15).
                   15  PLACE-LONGITUDE        PIC X(15).
                   15  PLACE-ISO-CODE         PIC X(6).
                   15  PLACE-DEFUNCT-DATE     PIC X(10).
                   15  PLACE-NOTES            PIC X(300).
                   15  PLACE-PAD              PIC X(315).

               10  GN-EVENT    REDEFINES GN-PAYLOAD.
                   15  EVENT-ID               PIC X(12).
                   15  EVENT-TYPE             PIC X(15).
                   15  EVENT-DATE             PIC X(10).
                   15  EVENT-DATE-QUAL        PIC X(1).
                   15  EVENT-DATE-END         PIC X(10).
                   15  EVENT-PLACE-ID         PIC X(12).
                   15  EVENT-DESCRIPTION      PIC X(300).
                   15  EVENT-AGE-AT-EVENT     PIC X(5).
                   15  EVENT-NOTES            PIC X(500).
                   15  EVENT-CREATED-AT       PIC X(14).
                   15  EVENT-PAD              PIC X(21).

               10  GN-SOURCE   REDEFINES GN-PAYLOAD.
                   15  SOURCE-ID              PIC X(12).
                   15  SOURCE-TITLE           PIC X(200).
                   15  SOURCE-AUTHOR          PIC X(100).
                   15  SOURCE-PUB-PLACE       PIC X(100).
                   15  SOURCE-PUB-DATE        PIC X(10).
                   15  SOURCE-REPOSITORY      PIC X(200).
                   15  SOURCE-CALL-NUMBER     PIC X(50).
                   15  SOURCE-TYPE            PIC X(15).
                   15  SOURCE-QUALITY         PIC X(1).
                   15  SOURCE-URL             PIC X(300).
                   15  SOURCE-NOTES           PIC X(500).
                   15  SOURCE-PAD             PIC X(24).

               10  GN-JOURNAL  REDEFINES GN-PAYLOAD.
                   15  JOURNAL-ID             PIC X(12).
                   15  JOURNAL-ENTRY-TS       PIC X(14).
                   15  JOURNAL-OP-TYPE        PIC X(10).
                   15  JOURNAL-ENTITY-TYPE    PIC X(15).
                   15  JOURNAL-ENTITY-ID      PIC X(12).
                   15  JOURNAL-DESCRIPTION    PIC X(500).
                   15  JOURNAL-OPERATOR       PIC X(8).
                   15  JOURNAL-SESSION-ID     PIC X(20).
                   15  JOURNAL-PAD            PIC X(309).

               10  GN-OTHER    REDEFINES GN-PAYLOAD.
                   15  GN-RAW-PAYLOAD         PIC X(900).

      *****************************************************************
      * END
      *****************************************************************