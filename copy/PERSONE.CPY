      ***************************************************************
      * COPYBOOK: PERSONE.CPY
      * STILE   : COBOL SU UNIX, FILE SEQUENZIALE TESTUALE
      ***************************************************************
      * FILE: PERSONE.DAT
      * DELIMITATORE: "|"
      * RECORD: 1 RIGA = 1 PERSONA
      ***************************************************************

      01 ID-PERSONA               OBBL  POS 01  ESEMPIO: P000001
      02 GEDCOM-ID                OBBL  POS 02  ESEMPIO: I123
      03 COGNOME                  OBBL  POS 03  ESEMPIO: GIARDINA
      04 NOME                     OBBL  POS 04  ESEMPIO: DANIEL
      05 SESSO                    FAC   POS 05  ESEMPIO: M
      06 DATA-NASCITA             FAC   POS 06  ESEMPIO: 1988-04-12
      07 LUOGO-NASCITA            FAC   POS 07  ESEMPIO: PALERMO
      08 DATA-MORTE               FAC   POS 08  ESEMPIO: 2020-01-01
      09 LUOGO-MORTE              FAC   POS 09  ESEMPIO: PALERMO
      10 FAMIGLIA-ORIGINE         FAC   POS 10  ESEMPIO: F000001
      11 FAMIGLIA-PRINCIPALE      FAC   POS 11  ESEMPIO: F000002
      12 ID-FONTI                 FAC   POS 12  ESEMPIO: S000001,S000002
      13 NOTE                     FAC   POS 13  ESEMPIO: IMPORT GEDCOM

      * VINCOLI:
      * - ID-PERSONA UNIVOCO
      * - DATE IN FORMATO YYYY | YYYY-MM | YYYY-MM-DD O VUOTO
      * - FAMIGLIE E FONTI RIFERITE DEVONO ESISTERE
