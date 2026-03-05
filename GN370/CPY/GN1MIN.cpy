      *****************************************************************
      * GN1MIN - INPUT MAP IO AREA (GN1MAPS/GN1PAGEI)
      *****************************************************************
       01  GN1MAPIN.
           05 MI-LL                  PIC S9(4) COMP.
           05 MI-ZZ                  PIC S9(4) COMP.
      * [PF:n] codice PF tradotto in input (01,03,05,06,07,09,11,12)
           05 MI-PFKEY               PIC X(2).
      * @SELF@ segmento corrente
           05 MI-SELFID              PIC X(12).
      * {NODE} nodo logico richiesto
           05 MI-NODEID              PIC X(8).
      * <REL> relazione padre->figlio
           05 MI-RELTXT              PIC X(20).
      * *EVT* tipo evento richiesto
           05 MI-EVTTYP              PIC X(12).
      * ?HYP? ipotesi non verificata
           05 MI-HYPTXT              PIC X(20).
      * $PROP$ proprieta/asset
           05 MI-PROPTX              PIC X(20).
      * ^TITLE^ titolo/rango
           05 MI-TITLET              PIC X(20).
