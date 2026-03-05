      *****************************************************************
      *                                                               *
      *                  DSECT PER MAPSET GN37M002                      *
      *                      MAPPA GN37D002                           *
      *   GENERATO MANUALMENTE DA CODEX AI PER SVILUPPO DETERMINISTICO  *
      *                                                               *
      *****************************************************************
      *    INPUT MAP
       01  GN37D002I.
           05  FILLER          PIC X(2).
           05  CMDINF          PIC X(1).
           05  CMDINA          PIC X(1).
           05  CMDINL          PIC S9(4) COMP.
           05  CMDIN           PIC X(40).

      *    OUTPUT MAP
       01  GN37D002O REDEFINES GN37D002I.
           05  FILLER          PIC X(2).
      *
      *      HEADER
           05  FILLER          PIC X(2).
           05  HDRTITLEF       PIC X(1).
           05  HDRTITLEA       PIC X(1).
           05  HDRTITLEL       PIC S9(4) COMP.
           05  HDRTITLE        PIC X(25).
      *
      *      NAV AREA (LEFT)
           05  FILLER          PIC X(2).
           05  NAVMRK1F        PIC X(1).
           05  NAVMRK1A        PIC X(1).
           05  NAVMRK1L        PIC S9(4) COMP.
           05  NAVMRK1         PIC X(1).
           05  FILLER          PIC X(2).
           05  NAVTXT1F        PIC X(1).
           05  NAVTXT1A        PIC X(1).
           05  NAVTXT1L        PIC S9(4) COMP.
           05  NAVTXT1         PIC X(9).
           05  FILLER          PIC X(2).
           05  NAVMRK2F        PIC X(1).
           05  NAVMRK2A        PIC X(1).
           05  NAVMRK2L        PIC S9(4) COMP.
           05  NAVMRK2         PIC X(1).
           05  FILLER          PIC X(2).
           05  NAVTXT2F        PIC X(1).
           05  NAVTXT2A        PIC X(1).
           05  NAVTXT2L        PIC S9(4) COMP.
           05  NAVTXT2         PIC X(9).
           
           COMP-FILLER-FOR-NAV-AREA-ETC.
           05  CANVASF         PIC X(1).
           05  CANVASA         PIC X(1).
           05  CANVASL         PIC S9(4) COMP.
           05  CANVAS          PIC X(500).  
      *
      *      INFO AREA (RIGHT)
           05  FILLER          PIC X(2).
           05  INFOSTPF        PIC X(1).
           05  INFOSTPA        PIC X(1).
           05  INFOSTPL        PIC S9(4) COMP.
           05  INFOSTP         PIC X(12).
           05  FILLER          PIC X(2).
           05  INFOACTF        PIC X(1).
           05  INFOACTA        PIC X(1).
           05  INFOACTL        PIC S9(4) COMP.
           05  INFOACT         PIC X(12).
           05  FILLER          PIC X(2).
           05  INFODSCF        PIC X(1).
           05  INFODSCA        PIC X(1).
           05  INFODSCL        PIC S9(4) COMP.
           05  INFODSC         PIC X(12).
      *
      *      FOOTER
           05  FILLER          PIC X(2).
           05  CMDOUTF         PIC X(1).
           05  CMDOUTA         PIC X(1).
           05  CMDOUTL         PIC S9(4) COMP.
           05  CMDOUT          PIC X(40).
           05  FILLER          PIC X(2).
           05  JOBSTATF        PIC X(1).
           05  JOBSTATA        PIC X(1).
           05  JOBSTATL        PIC S9(4) COMP.
           05  JOBSTAT         PIC X(8).
           05  FILLER          PIC X(2).
           05  THEMEDISPF      PIC X(1).
           05  THEMEDISPA      PIC X(1).
           05  THEMEDISPL      PIC S9(4) COMP.
           05  THEMEDISP       PIC X(8).
           05  FILLER          PIC X(2).
           05  SELFDSPF        PIC X(1).
           05  SELFDSPA        PIC X(1).
           05  SELFDSP_L       PIC S9(4) COMP.
           05  SELFDSP         PIC X(12).
