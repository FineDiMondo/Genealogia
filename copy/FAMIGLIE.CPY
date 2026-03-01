      ***************************************************************
      * COPYBOOK: FAMIGLIE.CPY
      * SCOPO   : SPEC TRACCIATO FILE SEQUENZIALE FAMIGLIE.DAT
      ***************************************************************

      [FILE]
      NOME-FILE         : FAMIGLIE.DAT
      DELIMITATORE      : |
      COMMENTI-AMMESSI  : RIGHE INIZIANTI CON "#"

      [LAYOUT]
      01  ID-FAMIGLIA             OBBL.  ESEMPIO: F000001
      02  COGNOME-FAMIGLIA        OBBL.  ESEMPIO: GIARDINA
      03  MACRO-GRUPPO            OBBL.  ESEMPIO: 1
      04  TIPO                    FAC.   ESEMPIO: DIRETTA
      05  ORIGINE                 FAC.   ESEMPIO: SICILIA
      06  ID-FONTI                FAC.   ESEMPIO: S000001,S000003
      07  NOTE                    FAC.   ESEMPIO: RAMO PATERNO

      [VINCOLI]
      - ID-FAMIGLIA UNIVOCO NEL FILE
      - ID-FONTI DEVONO ESISTERE IN FONTI.DAT (SE VALORIZZATI)
