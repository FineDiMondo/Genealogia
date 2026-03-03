# Bibbia del Prototipo — Genealogia Sicula

## Pagina 1 di 14

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

## Pagina 2 di 14

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

## Pagina 3 di 14

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  SHEET 02 OF 14 — DATA STRUCTURE / ENTITY RELATIONSHIP DIAGRAM                              ║
║  GN370 V2.0 — STRUTTURA DATI: COPYBOOK COBOL → SQL DDL → NDJSON .TABLE                     ║
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
