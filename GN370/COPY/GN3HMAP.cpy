      *****************************************************************
      *                                                               *
      *                  DSECT PER MAPSET GN37M001                      *
      *                      MAPPA GN37D001                           *
      *   GENERATO MANUALMENTE DA CODEX AI PER SVILUPPO DETERMINISTICO  *
      *                                                               *
      *****************************************************************
      *    INPUT MAP
       01  GN37D001I.
           05  FILLER          PIC X(2).
           05  CMDINF          PIC X(1).
           05  CMDINA          PIC X(1).
           05  CMDINL          PIC S9(4) COMP.
           05  CMDIN           PIC X(8).

      *    OUTPUT MAP
       01  GN37D001O REDEFINES GN37D001I.
           05  FILLER          PIC X(2).
      *
      *      HEADER FIELDS
           05  FILLER          PIC X(2).
           05  CMDOUTF         PIC X(1).
           05  CMDOUTA         PIC X(1).
           05  CMDOUTL         PIC S9(4) COMP.
           05  CMDOUT          PIC X(8).
      *
      *      WORLD-1 (ORIGINI)
           05  FILLER          PIC X(2).
           05  W1LBLF          PIC X(1).
           05  W1LBLA          PIC X(1).
           05  W1LBLL          PIC S9(4) COMP.
           05  W1LBL           PIC X(16).
      *
      *      WORLD-2 (CICLI)
           05  FILLER          PIC X(2).
           05  W2LBLF          PIC X(1).
           05  W2LBLA          PIC X(1).
           05  W2LBLL          PIC S9(4) COMP.
           05  W2LBL           PIC X(16).
      *
      *      WORLD-3 (DONI)
           05  FILLER          PIC X(2).
           05  W3LBLF          PIC X(1).
           05  W3LBLA          PIC X(1).
           05  W3LBLL          PIC S9(4) COMP.
           05  W3LBL           PIC X(16).
      *
      *      WORLD-4 (OMBRE)
           05  FILLER          PIC X(2).
           05  W4LBLF          PIC X(1).
           05  W4LBLA          PIC X(1).
           05  W4LBLL          PIC S9(4) COMP.
           05  W4LBL           PIC X(16).
      *
      *      WORLD-5 (CONTESTO)
           05  FILLER          PIC X(2).
           05  W5LBLF          PIC X(1).
           05  W5LBLA          PIC X(1).
           05  W5LBLL          PIC S9(4) COMP.
           05  W5LBL           PIC X(16).
      *
      *      WORLD-6 (STRUTTURA)
           05  FILLER          PIC X(2).
           05  W6LBLF          PIC X(1).
           05  W6LBLA          PIC X(1).
           05  W6LBLL          PIC S9(4) COMP.
           05  W6LBL           PIC X(16).
      *
      *      WORLD-7 (EREDITA)
           05  FILLER          PIC X(2).
           05  W7LBLF          PIC X(1).
           05  W7LBLA          PIC X(1).
           05  W7LBLL          PIC S9(4) COMP.
           05  W7LBL           PIC X(16).
      *
      *      WORLD-8 (NEBBIA)
           05  FILLER          PIC X(2).
           05  W8LBLF          PIC X(1).
           05  W8LBLA          PIC X(1).
           05  W8LBLL          PIC S9(4) COMP.
           05  W8LBL           PIC X(16).
      *
      *      WORLD-9 (RADICI)
           05  FILLER          PIC X(2).
           05  W9LBLF          PIC X(1).
           05  W9LBLA          PIC X(1).
           05  W9LBLL          PIC S9(4) COMP.
           05  W9LBL           PIC X(16).
           05  FILLER          PIC X(2).
           05  ROOTSYMF        PIC X(1).
           05  ROOTSYMA        PIC X(1).
           05  ROOTSYML        PIC S9(4) COMP.
           05  ROOTSYM         PIC X(1).
           05  FILLER          PIC X(2).
           05  ROOTNAMF        PIC X(1).
           05  ROOTNAMA        PIC X(1).
           05  ROOTNAML        PIC S9(4) COMP.
           05  ROOTNAM         PIC X(10).
      *
      *      FOOTER FIELDS
           05  FILLER          PIC X(2).
           05  MSGDTLF         PIC X(1).
           05  MSGDTLA         PIC X(1).
           05  MSGDTLL         PIC S9(4) COMP.
           05  MSGDTL          PIC X(78).
           05  FILLER          PIC X(2).
           05  SELFDSPF        PIC X(1).
           05  SELFDSPA        PIC X(1).
           05  SELFDSP_L       PIC S9(4) COMP.
           05  SELFDSP         PIC X(16).
           05  FILLER          PIC X(2).
           05  JOBSTATF        PIC X(1).
           05  JOBSTATA        PIC X(1).
           05  JOBSTATL        PIC S9(4) COMP.
           05  JOBSTAT         PIC X(8).
           05  FILLER          PIC X(2).
           05  THEMEDISPF      PIC X(1).
           05  THEMEDISPA      PIC X(1).
           05  THEMEDISPL      PIC S9(4) COMP.
           05  THEMEDISP       PIC X(16).
