      *================================================================*
      * GN370-NORM-RECORD.cpy  VERSION 1.0                            *
      * Output S3 NORM_AGENT                                           *
      *================================================================*
       01 GN370-NORM-RECORD.
          05 GNR-PIPELINE-ID       PIC X(20).
          05 GNR-GEDCOM-XREF       PIC X(30).
          05 GNR-RECORD-TYPE       PIC X(10).
          05 GNR-SURNAME-NORM      PIC X(80).
          05 GNR-SURNAME-ORIG      PIC X(80).
          05 GNR-SURNAME-CONF      PIC 9(03).
          05 GNR-GIVEN-NORM        PIC X(80).
          05 GNR-GIVEN-ORIG        PIC X(80).
          05 GNR-GIVEN-CONF        PIC 9(03).
          05 GNR-BIRTH-DATE-ISO    PIC X(10).
          05 GNR-BIRTH-DATE-QUAL   PIC X(01).
          05 GNR-BIRTH-DATE-CONF   PIC 9(03).
          05 GNR-BIRTH-PLACE-ID    PIC X(12).
          05 GNR-BIRTH-PLACE-NORM  PIC X(200).
          05 GNR-BIRTH-PLACE-CONF  PIC 9(03).
          05 GNR-DEATH-DATE-ISO    PIC X(10).
          05 GNR-DEATH-DATE-QUAL   PIC X(01).
          05 GNR-DEATH-DATE-CONF   PIC 9(03).
          05 GNR-DEATH-PLACE-ID    PIC X(12).
          05 GNR-TITLE-NORM        PIC X(100).
          05 GNR-TITLE-CONF        PIC 9(03).
          05 GNR-NOBLE-RANK        PIC X(20).
          05 GNR-NORM-FLAGS.
             10 GNR-NAME-MODIFIED  PIC X(01).
             10 GNR-DATE-MODIFIED  PIC X(01).
             10 GNR-PLACE-MODIFIED PIC X(01).
             10 GNR-TITLE-MODIFIED PIC X(01).
          05 GNR-NORM-WARNINGS     OCCURS 20 TIMES.
             10 GNR-WARN-CODE      PIC X(08).
             10 GNR-WARN-MSG       PIC X(100).
          05 GNR-WARN-COUNT        PIC 9(02).
          05 GNR-NORM-TS           PIC X(14).
          05 GNR-NORM-STATUS       PIC X(01).
             88 GNR-NORM-OK        VALUE "K".
             88 GNR-NORM-PARTIAL   VALUE "P".
             88 GNR-NORM-FAIL      VALUE "F".
