      ***************************************************************
      * COPYBOOK: FONTI.CPY
      * SCOPO   : SPEC TRACCIATO FILE SEQUENZIALE FONTI.DAT
      ***************************************************************

      [FILE]
      NOME-FILE         : FONTI.DAT
      DELIMITATORE      : |
      COMMENTI-AMMESSI  : RIGHE INIZIANTI CON "#"

      [LAYOUT]
      01  ID-FONTE                OBBL.  ESEMPIO: S000001
      02  TIPO                    OBBL.  ESEMPIO: GEDCOM
      03  TITOLO                  OBBL.  ESEMPIO: ALBERO GIARDINA-NEGRINI
      04  DATA-DOCUMENTO          FAC.   ESEMPIO: 2026-03-01
      05  ARCHIVIO                FAC.   ESEMPIO: ARCHIVIO FAMILIARE
      06  RIFERIMENTO             FAC.   ESEMPIO: GED-001
      07  URL                     FAC.   ESEMPIO: https://...
      08  NOTE                    FAC.   ESEMPIO: FONTE BASE PROGETTO

      [VINCOLI]
      - ID-FONTE UNIVOCO NEL FILE
      - DATA-DOCUMENTO IN FORMATO ISO YYYY-MM-DD OPPURE VUOTO
