      ***************************************************************
      * COPYBOOK: EVENTI.CPY
      * SCOPO   : SPEC TRACCIATO FILE SEQUENZIALE EVENTI.DAT
      ***************************************************************

      [FILE]
      NOME-FILE         : EVENTI.DAT
      DELIMITATORE      : |
      COMMENTI-AMMESSI  : RIGHE INIZIANTI CON "#"

      [LAYOUT]
      01  ID-EVENTO               OBBL.  ESEMPIO: E000001
      02  TIPO-EVENTO             OBBL.  ESEMPIO: NASCITA
      03  DATA-EVENTO             FAC.   ESEMPIO: 1988-04-12
      04  LUOGO                   FAC.   ESEMPIO: PALERMO
      05  ID-PERSONA              FAC.   ESEMPIO: P000001
      06  ID-FAMIGLIA             FAC.   ESEMPIO: F000001
      07  ID-FONTE                FAC.   ESEMPIO: S000001
      08  DESCRIZIONE             FAC.   ESEMPIO: NASCITA REGISTRATA

      [VINCOLI]
      - ID-EVENTO UNIVOCO NEL FILE
      - ALMENO UNO TRA ID-PERSONA E ID-FAMIGLIA DEVE ESSERE VALORIZZATO
      - ID-PERSONA / ID-FAMIGLIA / ID-FONTE DEVONO ESISTERE NEI FILE RELATIVI
