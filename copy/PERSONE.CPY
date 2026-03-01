      ***************************************************************
      * COPYBOOK: PERSONE.CPY
      * SCOPO   : SPEC TRACCIATO FILE SEQUENZIALE PERSONE.DAT
      * FORMATO : 1 RECORD = 1 RIGA, CAMPI DELIMITATI DA "|"
      * ENCODING: UTF-8 SENZA BOM
      ***************************************************************

      [FILE]
      NOME-FILE         : PERSONE.DAT
      DELIMITATORE      : |
      COMMENTI-AMMESSI  : RIGHE INIZIANTI CON "#"

      [LAYOUT]
      01  ID-PERSONA              OBBL.  ESEMPIO: P000001
      02  COGNOME                 OBBL.  ESEMPIO: GIARDINA
      03  NOME                    OBBL.  ESEMPIO: DANIEL
      04  SESSO                   OBBL.  ESEMPIO: M (M/F/U)
      05  DATA-NASCITA            FAC.   ESEMPIO: 1988-04-12
      06  LUOGO-NASCITA           FAC.   ESEMPIO: PALERMO
      07  DATA-MORTE              FAC.   ESEMPIO: 2020-01-01
      08  LUOGO-MORTE             FAC.   ESEMPIO: PALERMO
      09  ID-FAMIGLIA             FAC.   ESEMPIO: F000001
      10  ID-FONTI                FAC.   ESEMPIO: S000001,S000002
      11  NOTE                    FAC.   ESEMPIO: CURATORE PROGETTO
      12  STATO                   FAC.   ESEMPIO: VERIFICATO

      [VINCOLI]
      - ID-PERSONA UNIVOCO NEL FILE
      - ID-FAMIGLIA DEVE ESISTERE IN FAMIGLIE.DAT (SE VALORIZZATO)
      - ID-FONTI DEVONO ESISTERE IN FONTI.DAT (SE VALORIZZATI)
      - DATE IN FORMATO ISO YYYY-MM-DD OPPURE VUOTO
