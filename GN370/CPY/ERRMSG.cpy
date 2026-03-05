      *****************************************************************
      *                                                               *
      *                       GN370 ERROR MESSAGES                    *
      *             COPYBOOK PER MESSAGGI DI ERRORE MAPPA             *
      *                                                               *
      *****************************************************************
       01 GN370-ERROR-MESSAGES.
          05 E001-INVALID-COMMAND.
             10 FILLER PIC X(18) VALUE 'E001: COMANDO NON '.
             10 FILLER PIC X(8)  VALUE 'VALIDO. '.
          05 E002-INVALID-PFKEY.
             10 FILLER PIC X(18) VALUE 'E002: TASTO PF NON'.
             10 FILLER PIC X(9)  VALUE ' GESTITO.'.
          05 E003-DLI-ERROR.
             10 FILLER PIC X(14) VALUE 'E003: ERRORE D'.
             10 FILLER PIC X(15) VALUE 'L/I, STATUS = '.
             10 DLI-ERROR-STATUS PIC X(2).

       01 ERROR-MESSAGE-GENERIC       PIC X(78).
