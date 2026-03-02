# GN370 Mockup 24x80 (Ultra-Compatto)

## 1.1 MAIN (HOME) - 24 righe x 80 colonne

```text
GN370 MAIN                                  BUILD 2026.03.02  DATA current
MODE STD370   CONTEXT NONE                  TECH 3NF|JOURNAL  AGT READY
------------------------------------------------------------------------------
OUTPUT
> READY. Type HELP or MENU.
> Last: (none)

------------------------------------------------------------------------------
SUGGEST
1 FEED /LAST 10     2 FIND PERSON "name"   3 JOB RUN PIPELINE   4 EXPLAIN
------------------------------------------------------------------------------
COMMAND ===> _
------------------------------------------------------------------------------
PF1=HELP PF3=BACK PF5=REFRESH PF7=UP PF8=DOWN PF9=FEED PF12=MENU
STATUS: OK
```

Note H/M:
- Header = identita epistemica (BUILD/DATA/MODE/CONTEXT/TECH/AGT)
- Output = journal conversazionale
- Suggest = prossime mosse (max 4 in ultra-compatto)
- Command line = unica sorgente input
- PF keys = affordance immediata

## 1.2 MENU (primo livello)

```text
GN370 MENU                                  BUILD 2026.03.02  DATA current
MODE STD370   CONTEXT NONE                  TECH ROUTE|STATE  AGT READY
------------------------------------------------------------------------------
1 FEED     (journal eventi / transazioni)
2 PERSON   (scheda persona + relazioni)
3 REL      (relazione/legame)
4 JOB      (pipeline e processi)
5 EXPLAIN  (trasparenza algoritmica)
6 SYSTEM   (version, cache, dataset)
------------------------------------------------------------------------------
COMMAND ===> _
------------------------------------------------------------------------------
PF1=HELP PF3=BACK PF12=MAIN
STATUS: OK
```

## 1.3 FEED (JOURNAL)

```text
GN370 FEED                                  BUILD 2026.03.02  DATA current
MODE STD370   CONTEXT JOURNAL               TECH NDJSON|SCAN  AGT EXPL
------------------------------------------------------------------------------
TS                TYPE       ID        ACTION      ST
2026-03-02 10:12  PERSON     P000123   NORMALIZE   OK
2026-03-02 10:13  PERSON     P000124   VALIDATE    WRN
2026-03-02 10:14  REL        R000045   LINK        OK
...
------------------------------------------------------------------------------
COMMAND ===> FEED /LAST 10
------------------------------------------------------------------------------
PF1=HELP PF3=BACK PF7=UP PF8=DOWN PF12=MENU
STATUS: OK
```

## 1.4 PERSON

```text
GN370 PERSON                                BUILD 2026.03.02  DATA current
MODE STD370   CONTEXT PERSON P000123         TECH PK|LOOKUP   AGT NORM
------------------------------------------------------------------------------
ID   P000123
NAME Paolo Giardina
BORN 1791-06-08  Palermo
DIED 1837-07-06  Palermo
FSID ----

REL
SPOUSE N000056     CHILD  P000200
EVT
BIRTH 1791  MARR 1815  DEATH 1837
------------------------------------------------------------------------------
COMMAND ===> _
------------------------------------------------------------------------------
PF1=HELP PF3=BACK PF9=FEED PF12=MENU
STATUS: INTEGRITY PASS
```

## 1.5 REL

```text
GN370 REL                                   BUILD 2026.03.02  DATA current
MODE STD370   CONTEXT REL R000045            TECH FK|CHECK    AGT VALID
------------------------------------------------------------------------------
ID   R000045
TYPE MARRIAGE
A    P000123
B    N000056
DATE 1815-05-01
PLAC Palermo

REF-INTEGRITY: VERIFIED
------------------------------------------------------------------------------
COMMAND ===> _
------------------------------------------------------------------------------
PF1=HELP PF3=BACK PF9=FEED PF12=MENU
STATUS: OK
```

## 1.6 JOB

```text
GN370 JOB                                   BUILD 2026.03.02  DATA current
MODE STD370   CONTEXT JOB PIPELINE           TECH BATCH|SEQ   AGT PIPE
------------------------------------------------------------------------------
IMPORT     [######------] 60%  (120/200)
NORMALIZE  [##----------] 20%  ( 40/200)
VALIDATE   [------------]  0%  (  0/200)
JOURNAL    [------------]  0%  (  0/200)

ERR 0  WRN 5
------------------------------------------------------------------------------
COMMAND ===> JOB RUN PIPELINE
------------------------------------------------------------------------------
PF1=HELP PF3=BACK PF12=MENU
STATUS: RUNNING
```

## 1.7 EXPLAIN

```text
GN370 EXPLAIN                               BUILD 2026.03.02  DATA current
MODE STD370   CONTEXT EXPL PERSON P000123    TECH RULES|INTROS AGT EXPL
------------------------------------------------------------------------------
ACTIVE TECH:
- MODEL: Relational 3NF (entity / relation / event separated)
- ALGO : PK lookup + FK integrity checks
- SRC  : NDJSON journal + entity store

LAST ACTION:
- show card -> entity render from normalized record
------------------------------------------------------------------------------
COMMAND ===> _
------------------------------------------------------------------------------
PF1=HELP PF3=BACK PF12=MENU
STATUS: OK
```
