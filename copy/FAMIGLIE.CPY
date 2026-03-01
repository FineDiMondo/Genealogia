      ***************************************************************
      * COPYBOOK: FAMIGLIE.CPY
      ***************************************************************
      * FILE: FAMIGLIE.DAT
      * DELIMITATORE: "|"

      01 ID-FAMIGLIA              OBBL  POS 01  ESEMPIO: F000001
      02 GEDCOM-ID                OBBL  POS 02  ESEMPIO: F12
      03 COGNOME-FAMIGLIA         FAC   POS 03  ESEMPIO: GIARDINA-NEGRINI
      04 ID-HUSB                  FAC   POS 04  ESEMPIO: P000001
      05 ID-WIFE                  FAC   POS 05  ESEMPIO: P000002
      06 ID-FIGLI                 FAC   POS 06  ESEMPIO: P000003,P000004
      07 DATA-MATRIMONIO          FAC   POS 07  ESEMPIO: 1985-06-01
      08 LUOGO-MATRIMONIO         FAC   POS 08  ESEMPIO: PALERMO
      09 ID-FONTI                 FAC   POS 09  ESEMPIO: S000001
      10 NOTE                     FAC   POS 10  ESEMPIO: IMPORT GEDCOM

      * VINCOLI:
      * - ID-FAMIGLIA UNIVOCO
      * - ID-HUSB, ID-WIFE, ID-FIGLI DEVONO ESISTERE IN PERSONE.DAT
      * - DATE FORMATO YYYY | YYYY-MM | YYYY-MM-DD O VUOTO
