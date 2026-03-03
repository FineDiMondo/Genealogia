# Bibbia del Prototipo — Genealogia Sicula

## Pagina 0 di 14

> Nota: per evitare errori di caricamento/rendering in alcuni viewer Markdown, le pagine 3–13 sono aggregate in blocchi multi-sheet mantenendo il contenuto ASCII invariato.

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                              ║
║   I B M   S Y S T E M S   F L O W C H A R T   P R O G R A M   T E M P L A T E             ║
║   FORM X28-1401-3   REVISED 1970   INTERNATIONAL BUSINESS MACHINES CORPORATION             ║
║                                                                                              ║
║   PROGRAM IDENTIFICATION:  G N 3 7 0   V 2 . 0                                             ║
║   GENEALOGIA SICULA — ARCHIVIO NOBILIARE — NORMANNI · ARAGONESI · RISORGIMENTO             ║
║   REPOSITORY: https://github.com/FineDiMondo/Genealogia                                     ║
║   DEPLOY:     https://finedimondo.github.io/Genealogia/                                     ║
║                                                                                              ║
║   ANALYST:    PROGRAMMATORE IBM                    DATE: ANNO DOMINI MCMLXX                 ║
║   NOTATION:   IBM FLOWCHARTING TEMPLATE X20-8020   SHEET: 1 OF 14                          ║
║                                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝
```

## Pagina 1 di 14

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 01 OF 14 — PROGRAM OVERVIEW / SYSTEM CONTEXT DIAGRAM                                 ║
║  GN370 V2.0 — CONTESTO DI SISTEMA E CONFINI DEL PROGRAMMA                                   ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

  EXTERNAL SYSTEMS                   GN370 V2.0 BOUNDARY                   OUTPUT MEDIA
  ═════════════════                  ═══════════════════════════════        ════════════

  ┌───────────────┐                  ╔═══════════════════════════╗
  │ USER GESTURE  │                  ║                           ║          ┌──────────┐
  │ FILE PICKER   │──── INPUT ──────>║   FETCH GATE              ║          │ SCREEN   │
  │ (VH-02)       │                  ║   (VH-01,VH-03)           ║─────────>│ TERMINAL │
  └───────────────┘                  ║                           ║          │ 80×24    │
                                     ║     DB STATE MACHINE      ║          └──────────┘
  ┌───────────────┐                  ║     EMPTY→LOADING→READY   ║
  │ GEDCOM FILE   │                  ║                           ║          ┌──────────┐
  │ .GED 5.5.1    │──── IMPORT ─────>║   GEDCOM PARSER           ║          │ ZIP FILE │
  │ / 7.0         │                  ║   (COBOL+C)               ║─────────>│ AAAAMM   │
  └───────────────┘                  ║                           ║          │ GGHHNN   │
                                     ║   VALIDATE ENGINE         ║          │ .zip     │
  ┌───────────────┐                  ║   IC01–IC08               ║          │(VH-09)   │
  │ SVG HERALDRY  │──── UPLOAD ─────>║   WR01–WR06               ║          └──────────┘
  │ (VH-04)       │                  ║                           ║
  └───────────────┘                  ║   THEME ENGINE            ║          ┌──────────┐
                                     ║   5 TEMI STORICI          ║          │ GEDCOM   │
  ┌───────────────┐                  ║                           ║─────────>│ EXPORT   │
  │ ARCHIVE LINKS │                  ║   9 MONDI / WORLDS        ║          │ .GED     │
  │ FamilySearch  │──── HINT? ──────>║   SEQUENZE TRANSAZ.       ║          │ LOSSLESS │
  │ Portale Anten.│                  ║                           ║          └──────────┘
  │ Arch.di Stato │                  ║   JOURNAL APPEND-ONLY     ║
  │ PROTONOTARO   │                  ║   (VH-07)                 ║          ┌──────────┐
  └───────────────┘                  ║                           ║          │ SVG      │
                                     ╚═══════════════════════════╝          │ STEMMI   │
  ┌───────────────┐                                                          │STANDALONE│
  │ DNA PROJECTS  │                     ↑ ↓ CONSTRAINTS                     └──────────┘
  │ Jardine DNA   │                  VH-01…VH-10  NON DEROGABILI
  │ FamilyTreeDNA │                  I1…I17 INVARIANT TESTS
  └───────────────┘
```

## Pagina 2 di 14

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 02 OF 14 — DATA STRUCTURE / ENTITY RELATIONSHIP DIAGRAM                              ║
║  GN370 V2.0 — STRUTTURA DATI: COPYBOOK COBOL → SQL DDL → NDJSON .TABLE                    ║
║  FONTE DI VERITA': COPYBOOK COBOL (VH-05)  —  SQL E NDJSON DERIVATI, MAI INDIPENDENTI      ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

  ╔══════════════════╗      1:N      ╔══════════════════╗      1:N      ╔══════════════════╗
  ║  HOUSE           ║──────────────>║  PERSON          ║──────────────>║  EVENT           ║
  ║ ────────────     ║              ║ ────────────     ║              ║ ────────────     ║
  ║ house_id PK      ║              ║ person_id PK     ║              ║ event_id PK      ║
  ║ GNH-HOUSE-ID     ║              ║ GNP-PERSON-ID    ║              ║ event_type       ║
  ║ name             ║              ║ gedcom_xref      ║<─────────────║ B/D/M/*MARK*     ║
  ║ title_prefix     ║<─────────────║ house_id FK      ║              ║ date             ║
  ║ origin_period    ║              ║ surname          ║              ║ place_id FK      ║
  ║ origin_place_id  ║              ║ given_name       ║              ╚══════════════════╝
  ╚══════════════════╝              ║ gender M/F/U     ║
           |                        ║ living_flag Y/N/U║              ╔══════════════════╗
           |  1:N                   ║ birth_date       ║──────────────>║  CITATION        ║
           v                        ║ birth_date_qual  ║  1:N         ║ ────────────     ║
  ╔══════════════════╗              ║ E/A/B/R/T/C/S    ║              ║ citation_id PK   ║
  ║  HERALDRY        ║              ║ birth_date_cal   ║              ║ source_id FK     ║
  ║ ────────────     ║              ║ G/J/H/F          ║              ║ person_id FK     ║
  ║ heraldry_id PK   ║              ║ birth_place_id   ║              ║ page/detail      ║
  ║ GNH-HERALDRY-ID  ║              ║ death_date       ║              ╚══════════════════╝
  ║ house_id FK      ║<─────────────║ death_place_id   ║
  ║ person_id FK     ║              ║ heraldry_ref FK  ║              ╔══════════════════╗
  ║ stemma_type      ║              ║ occupation       ║              ║  SOURCE          ║
  ║ COAT/CREST/BADGE ║              ║ religion         ║──────────────>║ ────────────     ║
  ║ /SEAL/BANNER     ║              ║ nationality      ║  1:N via      ║ source_id PK     ║
  ║ date_from/to     ║              ║ notes            ║  CITATION     ║ title            ║
  ║ is_current Y/N   ║              ║ created_at       ║              ║ PROTONOTARO      ║
  ║ BLASONATURA:     ║              ║ updated_at       ║              ║ CATASTO 1651     ║
  ║  field           ║              ║ version_seq      ║              ║ RIVELE 1651      ║
  ║  ordinary        ║              ║ is_deleted Y/N   ║              ║ ARCHIVIO PA      ║
  ║  charges         ║              ╚══════════════════╝              ║ REG.MAT.PA       ║
  ║  tinctures       ║                       |                        ║ FamilySearch     ║
  ║  motto           ║                       | N:M via                ╚══════════════════╝
  ║  supporters      ║                       | FAMILY_LINK
  ║  crown           ║                       v
  ║  full_blazon     ║              ╔══════════════════╗              ╔══════════════════╗
  ║ svg_data (65535B)║              ║  FAMILY          ║              ║  TITLE           ║
  ║ svg_thumbnail    ║              ║ ────────────     ║              ║ ────────────     ║
  ║ svg_format 1.1/2 ║              ║ family_id PK     ║──────────────>║ title_id PK      ║
  ║ origin_type:     ║              ║ husband_id FK    ║  1:N via      ║ title_name       ║
  ║ UPLOAD/COCI/     ║              ║ wife_id FK       ║  TITLE_ASSIGN ║ PRINCIPI FICAR. ║
  ║ LIBRO/MANUAL     ║              ║ marr_date        ║              ║ DUCHI DI GELA    ║
  ║ quality 1–5:     ║              ║ marr_place_id    ║              ║ PRINCIPI S.CAT.  ║
  ║ 5=CERTIFIED      ║              ║ MATR-1775 ←KEY   ║              ║ RE DI SICILIA    ║
  ║ 4=ATTESTED       ║              ╚══════════════════╝              ║ COMMISSARIO R.P. ║
  ║ 3=PROBABLE       ║                                                ║ NOBILE PALERM.   ║
  ║ 2=UNCERTAIN      ║              ╔══════════════════╗              ╚══════════════════╝
  ║ 1=HYPOTHETICAL   ║              ║  RELATION        ║
  ╚══════════════════╝              ║ ────────────     ║              ╔══════════════════╗
                                    ║ relation_id PK   ║              ║  PLACE           ║
  ╔══════════════════╗              ║ person_a FK      ║              ║ ────────────     ║
  ║  JOURNAL         ║              ║ person_b FK      ║              ║ place_id PK      ║
  ║ ────────────     ║              ║ rel_type         ║              ║ place_name       ║
  ║ journal_id PK    ║              ║ DNA/ALLEANZA/    ║              ║ PALERMO          ║
  ║ entry_ts         ║              ║ MATRIMONIO/DISCEN║              ║ FICARAZZI        ║
  ║ op_type:         ║              ║ quality          ║              ║ GELA             ║
  ║ IMPORT           ║              ║ DOC/IPOT/LACUNA  ║              ║ S.CATERINA       ║
  ║ EXPORT           ║              ╚══════════════════╝              ║ NORMANDIA        ║
  ║ HERALDRY_IMPORT  ║                                                ║ PALERMO ~38N 13E ║
  ║ GEDCOM_IMPORT    ║              ╔══════════════════╗              ╚══════════════════╝
  ║ VALIDATE         ║              ║  META            ║
  ║ RESET            ║              ║ ────────────     ║
  ║ SESSION_START    ║              ║ meta_id PK       ║
  ║ SESSION_END      ║              ║ schema_version   ║
  ║ ERROR            ║              ║ dataset_name     ║
  ║ entity_type      ║              ║ created_at       ║
  ║ entity_id        ║              ║ env DEV/TEST/PROD║
  ║ description      ║              ╚══════════════════╝
  ║ operator         ║
  ║ session_id       ║    NOTE: JOURNAL = APPEND-ONLY (VH-07)
  ║ env DEV/TEST/PROD║    NO UPDATE / NO DELETE MAI
  ╚══════════════════╝
```

## Pagine 4–7 di 14

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 03 OF 14 — PROGRAM FLOW: BOOT SEQUENCE                                               ║
║  GN370 V2.0 — SEQUENZA DI AVVIO / VINCOLI VH-01 VH-02 VH-03                                ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

                             ╔═══════╗
                             ║ START ║
                             ╚═══╤═══╝
                                 │
                    ┌────────────▼─────────────┐
                    │  FETCH GATE OVERRIDE      │
                    │  window.fetch INTERCEPT   │
                    │  PRIMO <script> NEL <body>│  ◄── CRITICO ASSOLUTO (VH-03)
                    │  se esternal. → VIOLA VH  │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  SET DB.status = 'EMPTY'  │  ◄── VH-01: BOOT DETERMINISTICO
                    │  SET CTX = null           │
                    │  SET fetch → BLOCKED      │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  LOAD config.js           │
                    │  3-LAYER CONFIG:          │
                    │   1. DEFAULTS             │
                    │   2. .rc FILE             │
                    │   3. RUNTIME              │
                    │  ENV = DEV / TEST / PROD  │  ◄── VH-10: AMBIENTI SEPARATI
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  LOAD theme.js            │
                    │  SPLASH TEMATICA          │
                    │  CINEMATOGRAFICA          │
                    │  80ms DELAY PER RIGA      │
                    │  TEMA ATTIVO:             │
                    │  NORMANNO ⚜              │
                    │  ARAGONESE ✦             │
                    │  IMPERIALE ☩             │
                    │  CASTIGLIANO ✠           │
                    │  RISORGIMENTALE ★         │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  ASSERT DB.status=EMPTY   │  ◄── VERIFICA POST-SPLASH
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  RENDER HOME              │
                    │  GRIGLIA 9 MONDI 3×3      │
                    │  STATUSBAR:               │
                    │  GN370$ _ IDLE EMPTY      │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  JOURNAL ENTRY:           │
                    │  GNJ-OP-TYPE=SESSION_START│
                    │  GNJ-ENV=DEV/TEST/PROD    │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  AWAIT USER GESTURE       │  ◄── VH-02: NESSUN AUTO-LOAD
                    │  file picker esplicito    │
                    │  NESSUN FETCH AUTOMATICO  │
                    └────────────┬─────────────┘
                                 │
                             ╔═══▼═══╗
                             ║ READY ║
                             ║ AWAIT ║
                             ╚═══════╝

  TEST INVARIANTI BOOT:
  ─────────────────────
  I1: TEST_BOOT_NO_DATA_FETCH  → ≥1 fetch /tables/ o .table → FAIL
  I2: TEST_BOOT_DB_EMPTY       → window.__GN370_DB_STATUS ≠ 'EMPTY' → FAIL
  I3: TEST_BOOT_CTX_NULL       → GN370.CTX.openedRecord ≠ null → FAIL

╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 04 OF 14 — PROGRAM FLOW: GEDCOM IMPORT TRANSACTION                                   ║
║  GN370 V2.0 — TRANSAZIONE DI IMPORT GEDCOM 5.5.1 / 7.0                                    ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

  ╔══════════╗
  ║  USER    ║
  ║ GESTURE  ║
  ║ FILE     ║
  ║ PICKER   ║
  ╚═════╤════╝
        │ .GED FILE
        ▼
  ┌─────────────────────┐        ┌─────────────────────┐
  │  GATE CHECK         │  FAIL  │  ERROR              │
  │  DB.status = READY? │──────>│  exitCode=2          │
  │  (VH-03)            │        │  "CARICARE DATASET"  │
  └──────────┬──────────┘        └─────────────────────┘
             │ PASS
             ▼
  ┌─────────────────────┐
  │  db.reset()         │  ◄── RESET PRIMA DI OGNI IMPORT
  │  DB.status = EMPTY  │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │  CONSERVA .GED      │  ◄── VH-08: FILE GEDCOM CONSERVATO
  │  originals/*.ged    │      INVARIANTE I17
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  GEDCOM PARSER (COBOL GN370-GEDCOM-PARSER.cbl + C TOKENIZER)       │
  │                                                                      │
  │  LEGGI RIGA:   GNG-LEVEL  GNG-XREF  GNG-TAG  GNG-VALUE             │
  │                GN370-GEDCOM-LINE (dal copybook GN370-GEDCOM-TAG.cpy)│
  │                                                                      │
  │  CONTEXT STACK: GNC-CURRENT-REC-TYPE / GNC-CURRENT-ID              │
  │                 GNC-LEVEL-STACK (10 livelli)                        │
  │                                                                      │
  │  TAG MAPPING:                                                        │
  │  0 @xref@ INDI  →  PERSON.gedcom_xref        GNP-GEDCOM-XREF       │
  │  1 NAME /Cogn/  →  surname + given_name       GNP-SURNAME           │
  │  1 SEX M/F      →  gender M→M F→F altro→U    GNP-GENDER            │
  │  1 BIRT/2 DATE  →  birth_date + qual          GNP-BIRTH-DATE        │
  │  ABT 1500       →  qual='A' date='1500'       GNP-BD-ABOUT          │
  │  BEF 1500       →  qual='B'                   GNP-BD-BEFORE         │
  │  AFT 1500       →  qual='R'                   GNP-BD-AFTER          │
  │  BET 1495 AND   →  qual='T' date2='1505'      GNP-BD-BETWEEN        │
  │  CAL 1500       →  qual='C'                   GNP-BD-CALC           │
  │  EST 1500       →  qual='S'                   GNP-BD-EST            │
  │  @#DJULIAN@     →  cal='J'                    GNP-JULIAN            │
  │  @#DHEBREW@     →  cal='H'                    GNP-HEBREW            │
  │  1 BIRT/2 PLAC  →  birth_place_txt            GNP-BIRTH-PLACE-TXT   │
  │  1 OCCU         →  occupation                 GNP-OCCUPATION        │
  │  1 NOTE         →  notes (concat multi-livello)                     │
  │  0 @xref@ FAM   →  FAMILY record                                    │
  │  1 HUSB         →  husband_id FK                                    │
  │  1 WIFE         →  wife_id FK                                       │
  │  1 MARR/2 DATE  →  marr_date                                        │
  └──────────┬──────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  VALIDATE INTEGRITY CONSTRAINTS (GN370-VALIDATE-IC.cbl)            │
  │                                                                      │
  │  IC01: person_id PK unico                                           │
  │  IC02: house_id FK → HOUSE esiste                                   │
  │  IC03: birth_date ≤ death_date (se entrambi presenti)               │
  │  IC04: gender IN ('M','F','U')                                      │
  │  IC05: source_id FK → SOURCE esiste (se citation presente)          │
  │  IC06: heraldry.house_id FK → HOUSE esiste                         │
  │  IC07: family husband_id FK → PERSON esiste                        │
  │  IC08: family wife_id FK → PERSON esiste                           │
  │                                                                      │
  │  WR01–WR06: WARNING RULES (non bloccanti)                           │
  └──────────┬──────────────────────────────────────────────────────────┘
             │
      ┌──────┴──────┐
      │  IC ERRORS? │
      └──────┬──────┘
     YES /   \ NO
      /         \
  ┌──▼──┐    ┌──▼─────────────────┐
  │ERROR│    │  WRITE NDJSON      │
  │LOG  │    │  .table FILES      │
  │JOUR.│    │  ##TABLE=PERSON    │
  └─────┘    │  |SCHEMA=2.0       │
             │  |CREATED=timestamp│
             │                    │
             │  PERSON.table      │
             │  FAMILY.table      │
             │  FAMILY_LINK.table │
             │  EVENT.table       │
             │  PLACE.table       │
             │  SOURCE.table      │
             │  CITATION.table    │
             │  TITLE.table       │
             │  TITLE_ASSIGNMENT  │
             │  HOUSE.table       │
             │  PERSON_HOUSE.table│
             │  HERALDRY.table    │
             │  RELATION.table    │
             │  JOURNAL.table     │
             └──────────┬─────────┘
                        │
             ┌──────────▼─────────┐
             │  DB.status = READY │
             │  JOURNAL ENTRY:    │
             │  GEDCOM_IMPORT     │
             │  entity_count      │
             └──────────┬─────────┘
                        │
             ┌──────────▼─────────┐
             │  TEST I8:          │
             │  INDI count GEDCOM │
             │  = PERSON count DB?│
             └────────────────────┘

  INVARIANTI GEDCOM:
  I8:  TEST_GEDCOM_IMPORT_COUNT  → INDI ≠ PERSON → FAIL
  I9:  TEST_GEDCOM_DATES_ABT     → ABT 1500 non → qual='A' → FAIL
  I17: TEST_GEDCOM_CONSERVED     → .ged non in originals/ → FAIL

╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 05 OF 14 — PROGRAM FLOW: HERALDRY IMPORT TRANSACTION                                 ║
║  GN370 V2.0 — TRANSAZIONE DI IMPORT ARALDICA SVG (VH-04)                                  ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

  ╔══════════╗
  ║  USER    ║
  ║ UPLOAD   ║
  ║ .SVG     ║
  ╚═════╤════╝
        │ SVG FILE
        ▼
  ┌─────────────────────┐        ┌─────────────────────────────┐
  │  FORMAT CHECK       │  FAIL  │  ERROR: PNG/JPG RIFIUTATO   │
  │  SVG? (VH-04)       │──────>│  "SVG FIRST: solo vettoriale │
  └──────────┬──────────┘        │   in HERALDRY.svg_data PROD" │
             │ PASS              └─────────────────────────────┘
             ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  SVG SANITIZER (C PARSER — sanitizeSVG)                     │
  │                                                               │
  │  RIMUOVI:  <script> ... </script>              (I10)        │
  │  RIMUOVI:  <iframe> ... </iframe>                            │
  │  RIMUOVI:  on* attributes  (onclick, onload…)  (I11)        │
  │  RIMUOVI:  javascript: URLs                                  │
  │  NORMALIZZA: viewBox per rendering coerente                  │
  │  PRESERVE: <circle> <rect> <path> <g> elementi legittimi    │
  └──────────┬───────────────────────────────────────────────────┘
             │
      ┌──────┴──────┐
      │  STILL      │
      │  MALICIOUS? │
      └──────┬──────┘
     YES /   \ NO
      /         \
  ┌──▼──┐    ┌──▼─────────────────────────────────────────────┐
  │RIFIC.│    │  PARSE BLASONATURA (GN370-HERALDRY-REC.cpy)    │
  │UTENTE│    │                                                 │
  └─────┘    │  GNH-HERALDRY-ID  (PIC X12)                    │
             │  GNH-HOUSE-ID     → FK → HOUSE (IC06)          │
             │  GNH-PERSON-ID    → FK → PERSON (opzionale)    │
             │  GNH-STEMMA-TYPE  COAT/CREST/BADGE/SEAL/BANNER │
             │                                                  │
             │  GNH-BLASONATURA:                               │
             │   GNH-FIELD       (200 char)                    │
             │   GNH-ORDINARY    (200 char)                    │
             │   GNH-CHARGES     (200 char)                    │
             │   GNH-TINCTURES   (100 char)                    │
             │   GNH-MOTTO       (100 char)                    │
             │   GNH-SUPPORTERS  (100 char)                    │
             │   GNH-CROWN       ( 50 char)                    │
             │   GNH-FULL-BLAZON (2000 char)                   │
             │                                                  │
             │  GNH-SVG-DATA     (65535 char max)              │
             │  GNH-SVG-THUMBNAIL(4096 char)                   │
             │  GNH-SVG-FORMAT   SVG-11 / SVG-20               │
             │                                                  │
             │  GNH-ORIGIN-TYPE:                               │
             │   UPLOAD / COCI / LIBRO-ORO / MANUAL            │
             │                                                  │
             │  GNH-QUALITY:                                   │
             │   5=CERTIFIED  4=ATTESTED  3=PROBABLE           │
             │   2=UNCERTAIN  1=HYPOTHETICAL                    │
             └──────────┬──────────────────────────────────────┘
                        │
             ┌──────────▼─────────────────────────────────────┐
             │  ASSOCIA A CASATO:                              │
             │                                                  │
             │  GIARDINA → Principi di Ficarazzi XVII          │
             │  NASELLI  → Duchi di Gela XIV                   │
             │  GRIMALDI → Principi di S.Caterina XII          │
             │  ALTAVILLA→ Re di Sicilia XII–XIII              │
             └──────────┬──────────────────────────────────────┘
                        │
             ┌──────────▼────────────┐
             │  WRITE HERALDRY.table │
             │  JOURNAL ENTRY:       │
             │  HERALDRY_IMPORT      │
             └───────────────────────┘

  INVARIANTI HERALDRY:
  I10: TEST_SVG_SANITIZE_SCRIPT  → <script> non rimosso → FAIL
  I11: TEST_SVG_SANITIZE_ONEVENT → onclick non rimosso → FAIL
  I12: TEST_HERALDRY_IC06        → house_id inesistente non → IC06 → FAIL

╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 06 OF 14 — PROGRAM FLOW: 9 MONDI / NAVIGATION ENGINE                                 ║
║  GN370 V2.0 — MOTORE DI NAVIGAZIONE FRA I 9 MONDI (YGGDRASIL)                             ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

                           ╔══════════════════╗
                           ║  HOME  GRID 3×3  ║
                           ║  @SELF@ GEN:XIV  ║
                           ║  ERA:RISORG IDLE ║
                           ╚═════════╤════════╝
                                     │
              ┌──────────────────────▼──────────────────────┐
              │          USER PRESSES [PF:n] or CMD          │
              └──────────────────────┬──────────────────────┘
                                     │
         ┌───────────┬───────────────┼───────────────┬───────────┐
         │           │               │               │           │
        PF1         PF2             PF3             PF4         PF5
         │           │               │               │           │
    ╔════▼════╗ ╔════▼════╗    ╔════▼════╗    ╔════▼════╗ ╔════▼════╗
    ║ MONDO 1 ║ ║ MONDO 2 ║    ║ MONDO 3 ║    ║ MONDO 4 ║ ║ MONDO 5 ║
    ║ ORIGINI ║ ║  CICLI  ║    ║  DONI   ║    ║  OMBRE  ║ ║CONTESTO ║
    ║ÁSGARÐR  ║ ║VANAHEIMR║    ║ÁLFHEIMR ║    ║JÖTUNHM. ║ ║MIÐGARÐR ║
    ╚════╤════╝ ╚════╤════╝    ╚════╤════╝    ╚════╤════╝ ╚════╤════╝
         │           │               │               │           │
         │    ┌──────┴───────┐       │               │           │
         │    │              │       │               │           │
        PF6  PF7            PF8     PF9          PF9:TEMA    PF12
         │    │              │       │
    ╔════▼════╗ ╔════▼════╗ ╔▼════════╗ ╔════▼════╗
    ║ MONDO 6 ║ ║ MONDO 7 ║ ║ MONDO 8 ║ ║ MONDO 9 ║
    ║STRUTTURA║ ║ EREDITÀ ║ ║  NEBBIA ║ ║ RADICI  ║
    ║SVARTÁLFA║ ║NIÐAVELLIR║ ║NIFLHEIMR║ ║   HEL   ║
    ╚═════════╝ ╚═════════╝ ╚═════════╝ ╚═════════╝

  OGNI MONDO ENTRA NELLA MEDESIMA STRUTTURA DI SEQUENZA:
  ═══════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────────────┐
  │  .gn-world-sequence.gn-world--{slug}                            │
  │                                                                   │
  │  .gn-seq-sidebar   .gn-seq-canvas   .gn-seq-detail              │
  │  [0,2 20×32]       [20,2 80×32]     [100,2 20×32]               │
  └──────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────▼──────────────────────────────────────┐
          │  SEQUENZA TRANSAZIONALE 9 STEP (universale):             │
          │                                                            │
          │  (SEQ:1) ENTRA    → accesso al mondo [PF:n]              │
          │  (SEQ:2) SURVEY / OVERVIEW / ANCHOR / SCAN / SELECT      │
          │  (SEQ:3) SELECT / FILTER / DESCEND / LIST / ERA          │
          │  (SEQ:4) EXPAND / PATTERN / CLUSTER / FIND / EVENT       │
          │  (SEQ:5) FOCUS / INSPECT / FOCUS / FIND2 / CROSS         │
          │  (SEQ:6) TRACE / EXPAND / COMPARE / DEPTH / MAP          │
          │  (SEQ:7) ARRIVE / GAP / INSIGHT / NAME / SOURCE          │
          │  (SEQ:8) REFLECT / SUGGEST / MAP / RITUAL / ANNOTATE     │
          │  (SEQ:9) EXPORT / SAVE / REFLECT / CLOSE / NEXT          │
          │                                                            │
          │  .gn-progress  [■■■□□□□□□]  step n/9                     │
          │  .gn-statusbar MONDO:n STEP:n/9 @SELF@ ERA JOB:IDLE      │
          └───────────────────┬──────────────────────────────────────┘
                              │
          ┌───────────────────▼──────────────────────────────────────┐
          │  ESITO: .gn-transaction-complete                         │
          │  → badge + insight panel + opzione EXPORT                │
          │  → JOURNAL ENTRY (GNJ-OP-TYPE appropriato)               │
          └──────────────────────────────────────────────────────────┘

  RISONANZE INTER-MONDO (GRAFO NAVIGAZIONE GLOBALE):
  ═══════════════════════════════════════════════════
  M1 ORIGINI   ←risonanza→  M5 CONTESTO   {titoli ↔ ere storiche}
  M2 CICLI     ←risonanza→  M4 OMBRE      {nascite ↔ esili/morti traumatiche}
  M3 DONI      ←risonanza→  M6 STRUTTURA  {professioni ↔ haplogroup DNA}
  M7 EREDITÀ   ←risonanza→  M8 NEBBIA     {beni documentati ↔ beni mancanti}
  M1–M8        ─────────────→ M9 RADICI   {tutti convergono in #ROOT#}
```

## Pagine 8–9 di 14

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 07 OF 14 — TRANSACTION DETAIL: MONDO 1 · ORIGINI / MONDO 6 · STRUTTURA              ║
║  GN370 V2.0 — LE DUE TRANSAZIONI CHE ATTRAVERSANO IL |PATH| VERTICALE COMPLETO             ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

  MONDO 1 · ORIGINI — "chi sei per diritto di sangue"
  ════════════════════════════════════════════════════

  (SEQ:1) ENTRA        [PF:1] o [WORLD:1]
      │
  (SEQ:2) SURVEY       ─→ 4 casati attivi: GIARDINA, NASELLI, GRIMALDI, ALTAVILLA
      │
  (SEQ:3) SELECT       ─→ {NODE:GIARDINA}  CMD "casato giardina"
      │
  (SEQ:4) EXPAND       ─→ ^TITLE^ albero nobiliare
      │                     ^Principi di Ficarazzi^  XVII sec.
      │                     ^Duchi di Gela^           XIV sec.
      │                     ^Principi di S.Caterina^  XII sec.
      │                     ^Re di Sicilia^            1072
      │
  (SEQ:5) FOCUS        ─→ ^Principi di Ficarazzi^   fonte: {PROTONOTARO DEL REGNO}
      │
  (SEQ:6) TRACE        ─→ |PATH| Gen.I → XIV
      │                     Pietro Giardina ~1500 #ROOT#
      │                     Giovanni ~1530
      │                     Salvatore ~1580
      │                     Francesco ~1610  {Rivele 1651}
      │                     Gaetano ~1650
      │                     Ignazio ~1695  Commissario R.P.
      │                     Paolo ~1720    Nobile Palermitano
      │                     Girolamo ~1750
      │                     [MATR-1775]  Girolamo × Concetta Naselli
      │                     Carlo 1776
      │                     Giuseppe 1810  {testimone 1848}
      │                     Calogero 1850  Notaio
      │                     ...
      │                     @SELF@ Gen. XIV
      │
  (SEQ:7) ARRIVE       ─→ @SELF@ connessione confermata
      │
  (SEQ:8) REFLECT      ─→ .gn-insight panel: CHI SEI PER SANGUE
      │
  (SEQ:9) EXPORT       ─→ PDF / JSON / GEDCOM
      │
  ESITO: CHI SEI PER SANGUE


  MONDO 6 · STRUTTURA — "la struttura nascosta del sangue"
  ══════════════════════════════════════════════════════════

  (SEQ:1) ENTRA        [PF:6] o [WORLD:6]
      │
  (SEQ:2) PROFILE      ─→ DNA disponibile?
      │
      ├── [SI]  ─→ (SEQ:3) IF-YES
      │                     R1b-L21 caricato  subclade R-DF13
      │
      └── [NO]  ─→ (SEQ:4) IF-NO
                             ?HINT?  Jardine DNA Project
                             FamilyTreeDNA  link diretto
      │
  (SEQ:5) MATCH        ─→ database casati normanni
      │                     match 12/37 markers
      │
  (SEQ:6) TRACE        ─→ |PATH| BIOLOGICO:
      │                     Yamnaya ~3000 a.C.   Steppa Pontica  proto-IE
      │                     → R1b haplogroup
      │                     → Vichinghi ~900 d.C.
      │                     → *GARD proto-germanico "recinto/custode"
      │                     → Normandia ~1000 d.C.
      │                     → Conquista Sicilia 1072  Ruggero d'Altavilla
      │                     → GIARDINA / JARDINE  Palermo
      │                     → Pietro Giardina ~1500  #ROOT# documentale
      │
  (SEQ:7) ORIGIN       ─→ #ROOT# genetico: Yamnaya ~3000 a.C.
      │
  (SEQ:8) CONNECT      ─→ BRIDGE: genetica + archivi documentali
      │                     DNA R1b-L21 ↔ Pietro Giardina #ROOT# Gen.I
      │
  (SEQ:9) REPORT       ─→ PDF .gn-export-dna
      │
  ESITO: FIRMA GENETICA  R1b-L21 NORMANNA → YAMNAYA 5000 ANNI

╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 08 OF 14 — TRANSACTION DETAIL: ~GAP~ DETECTION & MANAGEMENT                          ║
║  GN370 V2.0 — GESTIONE LACUNE: MONDO 2·CICLI / MONDO 4·OMBRE / MONDO 8·NEBBIA              ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

  CATALOGO LACUNE DOCUMENTATE NEL DATASET GIARDINA
  ═════════════════════════════════════════════════

  ~GAP-A~  LACUNA 1560–1640  (80 ANNI)
           Periodo Aragonese · Silenzio totale · Record mancanti
           Rilevato in: MONDO 4:OMBRE (SEQ:4 FIND)
           Priorità: ALTA
           Strategia: Archivio Vescovile Palermo 1560–1640
                      Registri battesimo parrocchiali

  ~GAP-B~  MOGLI NON DOCUMENTATE  (6 MATRIMONI)
           Ignazio ~1695    × ?  (nome moglie sconosciuto)
           Paolo ~1720      × ?
           Girolamo ~1750   × ?  (poi MATR-1775 documentato)
           Carlo 1776       × ?
           Giuseppe 1810    × ?
           Calogero 1850    × ?
           Rilevato in: MONDO 2:CICLI (SEQ:7 GAP)
                        MONDO 8:NEBBIA (SEQ:4 TOP · Lacuna #1)
           Priorità: ALTA · 6 nomi mancanti
           Strategia: Registri ecclesiastici PA 1650–1810
                      FamilySearch · Portale Antenati

  ~GAP-C~  RIVELE 1651 PARZIALE
           Francesco Giardina ~1610 · beni parzialmente documentati
           Rilevato in: MONDO 7:EREDITÀ (SEQ:6 GAP)
           Priorità: MEDIA
           Strategia: Archivio Real Patrimonio PA

  ~GAP-D~  TITOLI NON CONFERMATI
           Ficarazzi → conferma fonti indipendenti
           Rilevato in: MONDO 1:ORIGINI (SEQ:5 FOCUS)
                        AI CLUSTER-C
           Priorità: MEDIA
           Strategia: Protonotaro del Regno

  ~GAP-E~  BOERIO / BOERI  ORIGINE MATERNA
           Clementina Boerio · linea materna
           Origine Ligurian-Piemontese ipotetica
           Rilevato in: AI CLUSTER-E
           Priorità: BASSA
           Strategia: Archivio di Stato Genova + Torino


  FLUSSO GESTIONE ~GAP~ — MONDO 8:NEBBIA
  ════════════════════════════════════════

  (SEQ:1) ENTRA        [PF:8]  "navigare l'ignoto con metodo"
      │
  (SEQ:2) SCAN         ─→ sistema scansiona TUTTE le ~GAP~ nel profilo
      │                     GAP-A + GAP-B + GAP-C + GAP-D + GAP-E
      │
  (SEQ:3) RANK         ─→ ?HINT? AI ordina per impatto:
      │                     ALTA:  GAP-A (80 anni), GAP-B (6 mogli)
      │                     MEDIA: GAP-C (Rivele), GAP-D (titoli)
      │                     BASSA: GAP-E (Boerio)
      │
  (SEQ:4) TOP          ─→ LACUNA #1: GAP-B mogli 1650–1810
      │                     .gn-gap-card priorità ALTA
      │
  (SEQ:5) STRATEGY     ─→ ?HINT? Registri ecclesiastici PA
      │
  (SEQ:6) ARCHIVE      ─→ link FamilySearch + Portale Antenati
      │
  (SEQ:7) NOTE         ─→ .gn-research-note salvata nel profilo
      │
  (SEQ:8) TRACK        ─→ stato: [IN RICERCA] / [CHIUSA]
      │
  (SEQ:9) NEXT         ─→ prossima lacuna in lista priorità
      │
  ESITO: LACUNE TRACCIATE CON METODOLOGIA


  CONNESSIONI ~GAP~ INTER-MONDO:
  ════════════════════════════════
  ~GAP~ in CICLI (SEQ:7)  ──────────→  NEBBIA (SEQ:2 SCAN)   archivio
  ~GAP~ in OMBRE (SEQ:4)  ──────────→  NEBBIA (SEQ:2 SCAN)   integrazione
  ~GAP~ in EREDITÀ (SEQ:6)──────────→  NEBBIA (SEQ:2 SCAN)   patrimonio
  ?HINT? in STRUTTURA (SEQ:4)───────→  RADICI (SEQ:5 DNA)    DNA research
```

## Pagine 10–11 di 14

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 09 OF 14 — TRANSACTION DETAIL: PATRIMONIO / CONFLUENZA 1775                          ║
║  GN370 V2.0 — MONDI 7·EREDITÀ e 1·ORIGINI: $ASSET$ E CONFLUENZA TRE CASATI                ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

  CATALOGO $ASSET$ DOCUMENTATO
  ══════════════════════════════

  CASATO GIARDINA:
  ─────────────────
  $Feudo Ficarazzi        XVII sec.   fonte: PROTONOTARO DEL REGNO
  $Casa Palermo           1500–oggi   fonte: documenti notarili
  $Terreni Palermo        1651        fonte: RIVELE 1651 (parziale ~GAP-C~)
  $Commissariato R.P.     ~1695       Ignazio Giardina  funzione patrimoniale

  CASATO NASELLI:
  ────────────────
  $Ducato di Gela         XIV sec.    fonte: archivi nobiliari siciliani
  $Dote Concetta 1775     1775        confluisce in matrimonio fondante

  CASATO GRIMALDI:
  ─────────────────
  $Principato S.Caterina  XII sec.    fonte: archivi normanni
  $Titolo via alleanza    XII–XIV     con Naselli

  CONFLUENZA 1775:
  ─────────────────
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║  [GIARDINA $Ficarazzi]  +  [NASELLI $Gela]  +  [GRIMALDI]  ║
  ║                    │              │                │         ║
  ║                    └──────────────┴────────────────┘         ║
  ║                                  │                           ║
  ║            MATRIMONIO FONDANTE 1775                          ║
  ║            Girolamo Giardina × Concetta Naselli              ║
  ║                                  │                           ║
  ║                    $PATRIMONIO UNIFICATO                      ║
  ║                      Carlo 1776 ← erede                      ║
  ║                                  │                           ║
  ║                    ... IX generazioni ...                     ║
  ║                                  │                           ║
  ║                              @SELF@                          ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝

  FLUSSO MONDO 7 · EREDITÀ — "cosa hanno costruito per te"
  ══════════════════════════════════════════════════════════

  (SEQ:1) ENTRA        [PF:7]
      │
  (SEQ:2) MAP          ─→ $ASSET$ per casato
      │                     $Ficarazzi · $Gela · $S.Caterina · $Casa PA
      │
  (SEQ:3) SELECT       ─→ $Feudo Ficarazzi
      │                     XVII sec. · .gn-asset-card
      │
  (SEQ:4) SOURCE       ─→ {PROTONOTARO DEL REGNO}
      │                     Archivio di Stato Palermo
      │
  (SEQ:5) CHAIN        ─→ |PATH| patrimoniale: catena trasmissione
      │                     Pietro → ... → Girolamo → Carlo → ...→ @SELF@
      │
  (SEQ:6) GAP          ─→ ~GAP-C~ Rivele 1651 parziale
      │                     ?HINT? Archivio Real Patrimonio PA
      │
  (SEQ:7) CONFLUENCE   ─→ $CONFLUENZA 1775: tre patrimoni uniti
      │                     Carlo 1776 eredita tutto
      │
  (SEQ:8) TODAY        ─→ Patrimonio materiale sopravvissuto? [IN RICERCA]
      │
  (SEQ:9) CLOSE        ─→ .gn-legacy-badge assegnato
      │
  ESITO: PATRIMONIO RICONOSCIUTO

╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 10 OF 14 — TRANSACTION DETAIL: AI HINT ENGINE / ?HINT? CLUSTER ANALYSIS             ║
║  GN370 V2.0 — MOTORE SUGGERIMENTI AI: 5 CLUSTER ATTIVI                                    ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

                    ┌──────────────────────────────────────────┐
                    │  AI ANALYSIS ENGINE                       │
                    │  Attivato da: ~GAP~ rilevate             │
                    │  Attivato da: ?HINT? richiesto           │
                    │  SCORE COMPLETEZZA DATASET:              │
                    │  TOTALE: 67%   DNA: 40%                  │
                    │  MOGLI: 15%    TITOLI: 80%               │
                    └──────────────────┬───────────────────────┘
                                       │
         ┌──────────────┬──────────────┼──────────────┬──────────────┐
         │              │              │              │              │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │CLUSTER-A│    │CLUSTER-B│    │CLUSTER-C│    │CLUSTER-D│    │CLUSTER-E│
    │  DNA    │    │ LACUNE  │    │ TITOLI  │    │  MOGLI  │    │ BOERIO  │
    │R1b-L21  │    │1560-1640│    │Ficarazzi│    │6 nomi   │    │Clementn.│
    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
         │              │              │              │              │
    Pietro ↔R1b    ?─?─Salv.    ?Ficarazzi     ?×Ignazio     Clem.Boerio
    Jardine DNA    rec.persi    conf.fonte      ?×Paolo       Liguria/Pi.
    SUGGERIM.:     SUGGERIM.:   SUGGERIM.:      ?×Carlo       SUGGERIM.:
    Test Y-DNA     Arch.Vescov. Protonotaro     ?×Giuseppe    Arch.Genova
    FamilyTree     PA 1560-1640 del Regno       ?×Calogero    + Arch.TO
    DNA Proj.      Reg.battesim               Reg.Eccles.
                                                PA 1650-1810
         │              │              │              │              │
    ATTIVATO IN:   ATTIVATO IN:   ATTIVATO IN:   ATTIVATO IN:   ATTIVATO IN:
    M6 SEQ:4       M8 SEQ:3       M1 SEQ:5       M2 SEQ:7       (background)
    M9 SEQ:5       M4 SEQ:4       M7 SEQ:4       M8 SEQ:4
                   M8 SEQ:3


  ?HINT? INLINE NEI MONDI:
  ═════════════════════════
  M2:CICLI  SEQ:4  PATTERN   ?HINT? "cluster nascite 1650-1720"
  M3:DONI   SEQ:4  CLUSTER   ?HINT? "funzioni giuridico-amm. Gen.IV→XI"
  M4:OMBRE  SEQ:3  SCAN      ?HINT? "archivi esilio/conflitto viceregno"
  M6:STRUCT SEQ:4  IF-NO     ?HINT? "suggerisci Jardine DNA Project"
  M6:STRUCT SEQ:5  MATCH     ?HINT? "match 12/37 markers normanni"
  M7:EREDIT SEQ:6  GAP       ?HINT? "Archivio Real Patrimonio PA"
  M8:NEBBIA SEQ:3  RANK      ?HINT? "AI ordina lacune per impatto"
  M8:NEBBIA SEQ:5  STRATEGY  ?HINT? "Registri eccles. PA 1650-1810"
  M9:RADICI SEQ:3  DESCEND   ?HINT? "Normandia ~1000 d.C."
```

## Pagina 11 di 14

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 11 OF 14 — PROGRAM FLOW: EXPORT & STATE MACHINE                                      ║
║  GN370 V2.0 — MACCHINA STATI DB + TRANSAZIONE DI EXPORT ZIP                               ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

  DB STATE MACHINE (state.js)
  ════════════════════════════

        ╔═══════╗
        ║ EMPTY ║  ◄── BOOT iniziale (VH-01)
        ╚═══╤═══╝      tutti i comandi dati: BLOCCATI
            │
            │  USER GESTURE: file picker
            │  (VH-02: SOLO da gesto esplicito)
            ▼
        ╔═════════╗
        ║ LOADING ║  ◄── GEDCOM parse in corso
        ╚═════╤═══╝      comandi dati: BLOCCATI
              │
              │  import completato + IC OK
              ▼
        ╔═══════╗
        ║ READY ║  ◄── dataset caricato, validato
        ╚═══╤═══╝      TUTTI i comandi: ABILITATI
            │
            │  db.reset() chiamato
            ▼
        ╔═══════╗
        ║ EMPTY ║  ◄── ritorno allo stato iniziale
        ╚═══════╝      invariante I14: reset idempotente 3×


  FLUSSO EXPORT ZIP (export.js)
  ══════════════════════════════

  ┌──────────────────────┐
  │  CMD: export / save  │
  │  [EXPORT] button     │
  └──────────┬───────────┘
             │
  ┌──────────▼───────────┐        ┌──────────────────────┐
  │  DB.status = READY?  │  NO   │  ERROR exitCode=2     │
  │  (VH-03)             │──────>│  "DATASET NON PRONTO" │
  └──────────┬───────────┘        └──────────────────────┘
             │ YES
             ▼
  ┌──────────────────────────────────────────────────────┐
  │  COSTRUISCI ZIP v2.0                                 │
  │                                                       │
  │  <nome>.zip   (VH-09: filename = AAAAGGMMHHMM.zip)  │
  │  ├── META.table                                      │
  │  ├── CHECKSUM.sha256                                 │
  │  ├── tables/                                         │
  │  │   ├── PERSON.table           (NDJSON)             │
  │  │   ├── FAMILY.table           (NDJSON)             │
  │  │   ├── FAMILY_LINK.table      (NDJSON)             │
  │  │   ├── EVENT.table            (NDJSON)             │
  │  │   ├── PERSON_EVENT.table     (NDJSON)             │
  │  │   ├── PLACE.table            (NDJSON)             │
  │  │   ├── SOURCE.table           (NDJSON)             │
  │  │   ├── CITATION.table         (NDJSON)             │
  │  │   ├── TITLE.table            (NDJSON)             │
  │  │   ├── TITLE_ASSIGNMENT.table (NDJSON)             │
  │  │   ├── HOUSE.table            (NDJSON)             │
  │  │   ├── PERSON_HOUSE.table     (NDJSON)             │
  │  │   ├── HERALDRY.table         (NDJSON) ← v2.0 NEW │
  │  │   ├── RELATION.table         (NDJSON)             │
  │  │   └── JOURNAL.table          (NDJSON) APPEND-ONLY │
  │  ├── originals/                                      │
  │  │   └── *.ged   ← VH-08: FILE GEDCOM CONSERVATO    │
  │  └── heraldry/                                       │
  │      └── *.svg   ← stemmi SVG standalone             │
  └──────────┬───────────────────────────────────────────┘
             │
  ┌──────────▼───────────┐
  │  VALIDATE FILENAME   │
  │  /^\d{12}\.zip$/     │  ◄── VH-09 + I6
  └──────────┬───────────┘
             │
  ┌──────────▼───────────┐
  │  DOWNLOAD ZIP        │
  │  JOURNAL ENTRY:EXPORT│
  └──────────┬───────────┘
             │
  ┌──────────▼───────────┐
  │  TEST I7: ROUNDTRIP  │
  │  Import→Export→Import│
  │  record count = same?│
  └──────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 12 OF 14 — ENTITY REFERENCE TABLE: TUTTE LE ENTITÀ NOMINATE NEL PROGETTO            ║
║  GN370 V2.0 — DIZIONARIO COMPLETO ENTITÀ: PERSONE / CASATI / LUOGHI / FONTI / SIMBOLI     ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

  ENTITÀ PERSONE (DATASET GIARDINA)
  ════════════════════════════════════
  ID REF           NOME                  ANNO    GEN   RUOLO / NOTA
  ──────────────   ────────────────────  ──────  ────  ──────────────────────────────────────
  GNP-I-001        Pietro Giardina       ~1500   I     #ROOT# Capostipite · Palermo/Corleone
  GNP-I-002        Giovanni Giardina     ~1530   II    testimone atti 1558
  GNP-I-003        Salvatore Giardina    ~1580   III   [post ~GAP-A~ 1560-1640]
  GNP-I-004        Francesco Giardina    ~1610   IV    Rivele 1651 · beni documentati
  GNP-I-005        Gaetano Giardina      ~1650   V
  GNP-I-006        Ignazio Giardina      ~1695   VI    Commissario del Real Patrimonio
  GNP-I-007        Paolo Giardina        ~1720   VII   Nobile Palermitano
  GNP-I-008        Girolamo Giardina     ~1750   VIII  Principe di Ficarazzi · MATR-1775
  GNP-I-009        Concetta Naselli      ~1756   VIII  Duchessa di Gela · MATR-1775
  GNP-I-010        Carlo Giardina        1776    IX    primo figlio post-confluenza
  GNP-I-011        Giuseppe Giardina     1810    X     testimone moti 1848 · Risorgimento
  GNP-I-012        Calogero Giardina     ~1850   XI    Notaio · primo atto completo del Regno
  GNP-I-013        Clementina Boerio     ?       ?     linea materna · origine Liguria/Piemonte
  @SELF@           UTENTE                oggi    XIV   punto di arrivo · R1b-L21


  ENTITÀ CASATI (HOUSE)
  ══════════════════════
  ID REF           CASATO               TITOLO PRIMARIO          EPOCA
  ──────────────   ─────────────────    ──────────────────────   ────────────
  HSE-001          GIARDINA             Principi di Ficarazzi    XVII sec.
  HSE-002          NASELLI              Duchi di Gela            XIV sec.
  HSE-003          GRIMALDI             Principi di S.Caterina   XII sec.
  HSE-004          ALTAVILLA            Re di Sicilia            1072–1266


  ENTITÀ LUOGHI (PLACE)
  ══════════════════════
  ID REF           LUOGO                COORD        NOTA
  ──────────────   ─────────────────    ──────────   ────────────────────────────────
  PLC-001          Palermo              38°N 13°E    Sede principale · 1500–oggi
  PLC-002          Ficarazzi            38°N 13°E    Feudo Giardina XVII
  PLC-003          Gela                 37°N 14°E    Ducato Naselli XIV
  PLC-004          Santa Caterina       37°N 14°E    Principato Grimaldi XII
  PLC-005          Normandia            49°N  0°E    Origine DNA R1b-L21 ~1000 d.C.
  PLC-006          Steppa Pontica       47°N 36°E    Yamnaya ~3000 a.C. proto-IE
  PLC-007          Cefalù               37°N 14°E    Cattedrale 1131 · Ruggero II
  PLC-008          Monreale             38°N 13°E    Mosaici normanni
  PLC-009          Corleone             37°N 13°E    Possibile nascita Pietro 1500


  ENTITÀ FONTI (SOURCE)
  ══════════════════════
  ID REF           FONTE                             TIPO       AFFIDABILITÀ
  ──────────────   ────────────────────────────────  ─────────  ────────────
  SRC-001          PROTONOTARO DEL REGNO             primaria   CERTIFIED(5)
  SRC-002          RIVELE 1651                       primaria   ATTESTED(4)
  SRC-003          CATASTO FEUDALE 1651              primaria   ATTESTED(4)
  SRC-004          ARCHIVIO DI STATO PALERMO         primaria   CERTIFIED(5)
  SRC-005          REGISTRI MATRIMONIALI PALERMO     primaria   CERTIFIED(5)
  SRC-006          ARCHIVIO REAL PATRIMONIO          primaria   ATTESTED(4)
  SRC-007          FamilySearch (online)             secondaria PROBABLE(3)
  SRC-008          Portale Antenati (ANAI)           secondaria PROBABLE(3)
  SRC-009          Jardine DNA Project               DNA        PROBABLE(3)
  SRC-010          FamilyTreeDNA                     DNA        PROBABLE(3)
  SRC-011          LIBRO D'ORO DELLA NOBILTÀ         primaria   ATTESTED(4)
  SRC-012          C.O.C.I. (Corpo Consolat.)        primaria   ATTESTED(4)


  ENTITÀ SIMBOLI / TOKEN CSS (da GN370-PROTOTYPE-V2.TXT)
  ════════════════════════════════════════════════════════
  SIMBOLO   CLASSE CSS              RUOLO FUNZIONALE
  ────────  ──────────────────────  ─────────────────────────────────────────
  [WORLD]   .gn-world-card          contenitore Mondo/Significato
  {NODE}    .gn-node                nodo (persona, evento, luogo)
  <LINK>    .gn-link                collegamento tra nodi
  |PATH|    .gn-path                percorso transazionale
  @SELF@    .gn-self                identità utente (punto di arrivo)
  #ROOT#    .gn-root                Pietro Giardina ~1500 (punto di partenza)
  ~GAP~     .gn-gap                 lacuna / dato mancante
  *MARK*    .gn-marker              evento B/D/M
  ?HINT?    .gn-hint                suggerimento AI
  $ASSET$   .gn-asset               proprietà / patrimonio
  ^TITLE^   .gn-title               titolo nobiliare
  =ERA=     .gn-era                 separatore era storica
  >ACTIVE<  .gn-active              selezione attiva
  (SEQ)     .gn-seq                 step sequenza transazionale
  [PF:n]    .gn-shortcut            tasto funzione PF1–PF9


  ENTITÀ TEMI CSS (da GN370v2_COWORK_PROMPT.md + gn370-*.css)
  ═════════════════════════════════════════════════════════════
  SLUG              NOME             PALETTE PRIMARIA    ORNAMENTO
  ─────────────     ───────────────  ──────────────────  ─────────
  risorgimento      RISORGIMENTALE   Verde + Rosso       ★
  normanno          NORMANNO         #8B1A1A + #C8A020   ⚜
  aragonese         ARAGONESE        #6E1A4A + oro       ✦
  imperiale         IMPERIALE        #1A1A6E + oro       ☩
  castigliano       CASTIGLIANO      #8B4513 + oro       ✠
  palermitano       PALERMITANO      Oro arabo-normanno  ⬡
  veronese          VERONESE         Vermiglio scaligero ◈
  italiano          ITALIANO         Tricolore           ★
  serenissima       SERENISSIMA      Oro dogale          ⚓
  medievale         MEDIEVALE        Pergamena           ✠
  barocco           BAROCCO          Nero + oro (dark)   ❈
  rinascimentale    RINASCIMENTALE   Terracotta φ        φ
```

## Pagine 13–14 di 14

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 13 OF 14 — PROGRAM FLOW: IMPLEMENTATION PHASES (25 STEP)                             ║
║  GN370 V2.0 — ORDINE DI IMPLEMENTAZIONE NON DEROGABILE (DA GN370v2_COWORK_PROMPT.md)       ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

  FASE 1 — COBOL LAYER  (GIORNI 1–3)
  ════════════════════════════════════
  STEP 01  copybooks/*.cpy               FONTE DI VERITÀ (VH-05)
           GN370-PERSON-REC.cpy          ogni campo NDJSON ↔ copybook 1:1
           GN370-HERALDRY-REC.cpy
           GN370-GEDCOM-TAG.cpy
           GN370-JOURNAL-REC.cpy
           GATE: ogni colonna SQL ha commento con nome campo copybook
           │
  STEP 02  ddl/gn370_schema_v2.0.sql     DERIVATO 1:1 dai copybook
           PERSON / FAMILY / EVENT       NON modificare indipendentemente
           PLACE / SOURCE / CITATION
           TITLE / TITLE_ASSIGNMENT
           HOUSE / PERSON_HOUSE
           HERALDRY / RELATION / JOURNAL / META
           │
  STEP 03  cobol/GN370-GEDCOM-PARSER.cbl struttura + mapping tabella §7
           │
  STEP 04  cobol/GN370-VALIDATE-IC.cbl   IC01–IC08 + WR01–WR06

  FASE 2 — FRONTEND CORE  (GIORNI 4–7)
  ══════════════════════════════════════
  STEP 05  index.html                    FETCH GATE INLINE: PRIMO <script>
           window.fetch OVERRIDE         ⚠ SE ESTERNAL. → VIOLA VH-03
           │
  STEP 06  assets/js/state.js            macchina stati CTX _audit
           │
  STEP 07  assets/js/config.js           3-layer + multi-env DEV/TEST/PROD
           │
  STEP 08  assets/js/theme.js            5 temi CSS variables injection
           │
  STEP 09  assets/js/journal.js          append-only pre-import buffer
           │
  STEP 10  assets/js/validate.js         IC01–IC08 WR01–WR06 read-only

  FASE 3 — GEDCOM E ARALDICA  (GIORNI 8–12)
  ═══════════════════════════════════════════
  STEP 11  assets/js/gedcom.js           parser GEDCOM 5.5.1 client-side
                                         GATE: TEST_GEDCOM_IMPORT_COUNT
           │
  STEP 12  assets/js/heraldry.js         SVG loader + sanitizer + renderer
                                         GATE: TEST_SVG_SANITIZE_SCRIPT
           │
  STEP 13  assets/js/db.js               ZIP load/commit struttura v2.0

  FASE 4 — VISUALIZZAZIONI RETRO  (GIORNI 13–17)
  ═════════════════════════════════════════════════
  STEP 14  assets/js/tree.js             albero SVG left-to-right max 5 gen
           │
  STEP 15  assets/js/timeline.js         timeline SVG per persona + =ERA=
           │
  STEP 16  assets/js/dashboard.js        monitor: genealogico/araldico/
                                          qualità/storico (grafico ASCII!)

  FASE 5 — ROUTER E COMANDI  (GIORNI 18–20)
  ═══════════════════════════════════════════
  STEP 17  assets/js/render.js           terminal renderer 5 temi
                                          splash cinematografica 80ms/riga
                                          cursore █ pulsante
           │
  STEP 18  assets/js/man.js              manpages 29 comandi
           │
  STEP 19  assets/js/router.js           29 HANDLERS history autocomplete
           │
  STEP 20  assets/js/export.js           ZIP v2.0 + GEDCOM + SVG standalone

  FASE 6 — TEST E CI  (GIORNI 21–23)
  ════════════════════════════════════
  STEP 21  test-fixtures/                sample-minimal.ged (5 INDI 2 FAM)
                                          sample-full.ged (50+ INDI)
                                          sample-stemma.svg (valido)
                                          malicious-stemma.svg (test XSS)
                                          noble-csv-sample.csv (COCI fmt)
           │
  STEP 22  tests/                        17 test invarianti
                                          GEDCOM tests + Heraldry tests
           │
  STEP 23  .github/workflows/            CI Playwright
                                          branch protection: verify-boot REQUIRED

  FASE 7 — STILE E POLISH  (GIORNI 24–25)
  ═════════════════════════════════════════
  STEP 24  assets/css/themes/            5 temi completi + font + ornamenti
           │
  STEP 25  assets/js/boot.js             splash tematica cinematografica
                                          NORMANNO: "ANNO DOMINI MLXIII —
                                          RUGGERO D'ALTAVILLA"
                                          ASSERT DB.status===EMPTY post-splash

╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 14 OF 14 — INVARIANT TEST MATRIX & VINCOLI NON NEGOZIABILI                           ║
║  GN370 V2.0 — MATRICE COMPLETA: VH + INVARIANTI I1–I17 + CI PIPELINE                      ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

  VINCOLI HARDWARE (VH) — NON DEROGABILI MAI
  ════════════════════════════════════════════
  VH-01  BOOT DETERMINISTICO      DB.status=EMPTY CTX=null fetch=BLOCKED
  VH-02  IMPORT SOLO USER GESTURE file picker esplicito · no auto-load URL
  VH-03  GATE ASSOLUTO            DB.status≠READY → zero comandi dati
  VH-04  SVG FIRST                stemmi = SVG obbligatorio · no PNG/JPG PROD
  VH-05  COPYBOOK = FONTE VERITÀ  DDL SQL + NDJSON derivati · mai viceversa
  VH-06  NO FRAMEWORK JS          vanilla HTML/CSS/JS · zero React/Vue/Angular
  VH-07  JOURNAL APPEND-ONLY      no UPDATE no DELETE su tabella JOURNAL mai
  VH-08  FILE GEDCOM CONSERVATO   .ged originale in dataset/originals/
  VH-09  FILENAME ZIP=TIMESTAMP   AAAAGGMMHHMM.zip · 12 cifre · no separatori
  VH-10  AMBIENTI SEPARATI        DEV/TEST/PROD · config distinta · no dati condivisi


  MATRICE INVARIANTI TEST I1–I17
  ════════════════════════════════
  ID    TEST NAME                    CONDIZIONE FAIL                  VH REF
  ────  ───────────────────────────  ───────────────────────────────  ──────
  I1    TEST_BOOT_NO_DATA_FETCH      ≥1 fetch /tables/ o .table       VH-01
  I2    TEST_BOOT_DB_EMPTY           __GN370_DB_STATUS ≠ 'EMPTY'      VH-01
  I3    TEST_BOOT_CTX_NULL           CTX.openedRecord ≠ null          VH-01
  I4    TEST_STATE_MACHINE           transizione illegale senza throw  —
  I5    TEST_GATE_BLOCKS             db.query() senza READY no exit=2  VH-03
  I6    TEST_EXPORT_FILENAME         ZIP non matcha /^\d{12}\.zip$/   VH-09
  I7    TEST_ROUNDTRIP_LOSSLESS      record count diverso post I→E→I  —
  I8    TEST_GEDCOM_IMPORT_COUNT     INDI GEDCOM ≠ PERSON dopo import  —
  I9    TEST_GEDCOM_DATES_ABT        ABT 1500 → qual≠'A'              VH-05
  I10   TEST_SVG_SANITIZE_SCRIPT     <script> non rimosso             VH-04
  I11   TEST_SVG_SANITIZE_ONEVENT    onclick non rimosso              VH-04
  I12   TEST_HERALDRY_IC06           house_id inesist. → no IC06      VH-05
  I13   TEST_JOURNAL_APPEND_ONLY     esiste UPDATE/DELETE su JOURNAL  VH-07
  I14   TEST_RESET_IDEMPOTENT        3× db.reset() → stato non =      —
  I15   TEST_THEME_SWITCH            CSS var non aggiornate post theme VH-10
  I16   TEST_ENV_SEPARATION          config DEV visibile in ENV=prod  VH-10
  I17   TEST_GEDCOM_CONSERVED        .ged non in originals/ post imp. VH-08


  CI PIPELINE — .github/workflows/
  ══════════════════════════════════
  TRIGGER: push + pull_request
  RUNNER:  ubuntu-latest Node 18
  ─────────────────────────────────────────────────────────────────
  STEP 1   npx playwright install chromium --with-deps
  STEP 2   npm install
  STEP 3   bash scripts/static_analysis.sh         → OK
  STEP 4   npx playwright test boot_invariants      I1 I2 I3
  STEP 5   npx playwright test gedcom_import        I8 I9 I17
  STEP 6   npx playwright test heraldry             I10 I11 I12
  STEP 7   node tests/gate_tests.js                 I5 I13 I14
  STEP 8   npx playwright test roundtrip_tests      I6 I7
  ─────────────────────────────────────────────────────────────────
  BRANCH PROTECTION: verify-boot REQUIRED per merge a main


  CHECKLIST PRE-DEPLOY (DA GN370v2_COWORK_PROMPT.md)
  ═════════════════════════════════════════════════════
  □ VH-01…VH-10 tutti verificati
  □ playwright test → 0 failures (17 suite)
  □ static_analysis.sh → OK
  □ verify_deployment.sh → OK
  □ sample-minimal.ged → 5 PERSON 2 FAMILY 0 errori
  □ sample-full.ged → senza errori + stemmi associati
  □ I17 TEST_GEDCOM_CONSERVED → .ged in originals/ ✓
  □ I10 TEST_SVG_SANITIZE_SCRIPT → script rimosso ✓
  □ tutti e 5 i temi visivamente corretti (+ 7 temi CSS aggiuntivi)
  □ dashboard tema NORMANNO → ornamenti ⚜ corretti
  □ db export → ZIP AAAAGGMMHHMM.zip → round-trip lossless
  □ deploy TEST funzionante
  □ deploy PROD funzionante
  □ branch protection: verify-boot required ✓


╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                              ║
║   E N D   O F   F L O W C H A R T   D O C U M E N T A T I O N                             ║
║                                                                                              ║
║   GN370 V2.0   14 SHEETS   ANALYST: IBM PROGRAMMER   ANNO DOMINI MCMLXX                   ║
║                                                                                              ║
║   NOTA DEL PROGRAMMATORE:                                                                    ║
║   Tutta la documentazione è estratta fedelmente dal corpus esistente:                       ║
║   GN370_Prototype_v2.txt · GN370v2_COWORK_PROMPT.md · GN370_ASCII_Atlas.txt                ║
║   Nessun dato è stato inventato, modificato o creato ex novo.                               ║
║   Ogni riferimento a entità, vincoli, invarianti e transazioni                              ║
║   corrisponde a materiale già prodotto e presente negli outputs.                            ║
║                                                                                              ║
║   ⚜ PER LA GLORIA DELLE FAMIGLIE SICILIANE — FINEDIMONDO APS 2025 ⚜                      ║
║                                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝
```
