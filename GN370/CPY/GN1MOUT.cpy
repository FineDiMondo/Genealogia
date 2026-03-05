      *****************************************************************
      * GN1MOUT - OUTPUT MAP IO AREA (GN1MAPS/GN1PAGEO)
      *****************************************************************
       01  GN1MAPOUT.
           05 MO-LL                  PIC S9(4) COMP.
           05 MO-ZZ                  PIC S9(4) COMP.
      * @SELF@ segmento corrente
           05 MO-SELFID              PIC X(12).
      * #ROOT# root segment key
           05 MO-ROOTID              PIC X(12).
      * {NODE} nodo attivo
           05 MO-NODEID              PIC X(8).
      * <REL> relazione attiva
           05 MO-RELTXT              PIC X(20).
      * |PATH| tracciato DL/I eseguito
           05 MO-PATHTX              PIC X(40).
      * ~GAP~ placeholder segmento assente
           05 MO-GAPTXT              PIC X(5).
      * *EVT* evento corrente
           05 MO-EVTTYP              PIC X(12).
      * ?HYP? stato ipotesi
           05 MO-HYPTXT              PIC X(20).
      * $PROP$ proprieta/asset
           05 MO-PROPTX              PIC X(20).
      * ^TITLE^ titolo/rango
           05 MO-TITLET              PIC X(20).
      * =ERA= separatore epoca
           05 MO-ERATXT              PIC X(5).
      * >ACTIVE< posizione PCB
           05 MO-PCBPOS              PIC X(20).
      * Messaggio deterministico E***
           05 MO-MSGTXT              PIC X(70).
      * Legenda PF disponibile
           05 MO-PFINFO              PIC X(70).
