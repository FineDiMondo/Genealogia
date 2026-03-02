# 🧬 DATA NORMALIZATION AGENT - MASTER SYSTEM GUIDE

**Version**: 1.0  
**Date**: 2024-03-15  
**Scope**: Intelligent batch data cleaning, deduplication, conflict resolution  
**Stack**: Python 3.12 + FastAPI + Claude API + Daemon + Web UI  
**Output Format**: GEDCOM 5.5.1 (standard genealogy)  
**Architecture**: Versatile (standalone CLI + REST API + Daemon + Web UI + Cowork)

---

## 📋 EXECUTIVE SUMMARY

A sophisticated multi-interface data normalization system that:

1. **Cleans genealogical data** (names, dates, places, relationships)
2. **Detects & resolves duplicates** across multiple sources
3. **Flags conflicts** for human review
4. **Auto-approves** high-confidence normalizations
5. **Maintains complete audit trail** (source attribution, change log)
6. **Works 5 ways**: CLI + REST API + Web UI + Daemon + Cowork
7. **Outputs GEDCOM** (standard genealogy format)

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│         DATA NORMALIZATION AGENT SYSTEM                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  INPUT SOURCES                                          │
│  ├── GEDCOM files (Ancestry, FamilySearch)             │
│  ├── JSON/CSV (manual entry, other systems)            │
│  └── Gestionale API (from web form)                    │
│         ↓                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  NORMALIZATION ENGINE (Claude-based)            │   │
│  │  ├── Name normalization                         │   │
│  │  ├── Date standardization                       │   │
│  │  ├── Place normalization (historical variants)  │   │
│  │  ├── Relationship validation                    │   │
│  │  ├── Duplicate detection                        │   │
│  │  └── Confidence scoring (0-100%)                │   │
│  └─────────────────────────────────────────────────┘   │
│         ↓                                               │
│  QUALITY CONTROL                                        │
│  ├── Auto-approval (threshold: 85%+)                   │
│  ├── Conflict flagging (< 85%)                         │
│  └── Source attribution                                │
│         ↓                                               │
│  OUTPUT FORMATS                                         │
│  ├── GEDCOM 5.5.1 (clean genealogy file)               │
│  ├── JSON (for gestionale)                             │
│  ├── CSV (for spreadsheet)                             │
│  └── Audit report (changes log)                        │
│         ↓                                               │
│  PERSISTENCE                                            │
│  ├── Database (PostgreSQL/SQLite)                      │
│  ├── File system (GEDCOM archives)                     │
│  └── Audit trail (complete change history)             │
│                                                         │
│  ACCESS INTERFACES                                      │
│  ├── 1️⃣ Python CLI (local batch)                       │
│  ├── 2️⃣ REST API (FastAPI endpoints)                   │
│  ├── 3️⃣ Web UI (form-based upload)                     │
│  ├── 4️⃣ Daemon (continuous monitoring)                 │
│  └── 5️⃣ Cowork Prompt (execution via Claude)           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 PROJECT STRUCTURE

```
genealogy-normalization-agent/
│
├── src/
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── normalization_engine.py      # Main orchestrator
│   │   ├── data_models.py               # Pydantic schemas
│   │   ├── quality_control.py           # Validation & scoring
│   │   ├── conflict_resolver.py         # Merge & deduplication
│   │   └── audit_logger.py              # Change tracking
│   │
│   ├── rules/
│   │   ├── __init__.py
│   │   ├── name_rules.py                # Name normalization
│   │   ├── date_rules.py                # Date parsing & validation
│   │   ├── place_rules.py               # Place name variants
│   │   ├── relationship_rules.py        # Family relationship validation
│   │   └── duplicate_detection.py       # Deduplication logic
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── server.py                    # FastAPI app
│   │   ├── routes.py                    # API endpoints
│   │   ├── middleware.py                # Auth, logging
│   │   └── schemas.py                   # Request/response models
│   │
│   ├── cli/
│   │   ├── __init__.py
│   │   ├── cli.py                       # Click CLI
│   │   ├── commands.py                  # CLI commands
│   │   └── formatters.py                # Output formatting
│   │
│   ├── daemon/
│   │   ├── __init__.py
│   │   ├── monitor.py                   # Watch folder/queue
│   │   └── scheduler.py                 # APScheduler tasks
│   │
│   ├── web/
│   │   ├── __init__.py
│   │   ├── app.py                       # Flask web UI
│   │   ├── templates/
│   │   │   ├── upload.html
│   │   │   ├── results.html
│   │   │   └── conflicts.html
│   │   └── static/
│   │       ├── css/
│   │       └── js/
│   │
│   ├── exporters/
│   │   ├── __init__.py
│   │   ├── gedcom_exporter.py           # GEDCOM 5.5.1 output
│   │   ├── json_exporter.py             # JSON format
│   │   ├── csv_exporter.py              # CSV format
│   │   └── audit_exporter.py            # Audit reports
│   │
│   └── utils/
│       ├── __init__.py
│       ├── config.py                    # Configuration
│       ├── database.py                  # DB connection
│       ├── logging.py                   # Logging setup
│       └── helpers.py                   # Utility functions
│
├── tests/
│   ├── test_normalization.py
│   ├── test_quality_control.py
│   ├── test_conflict_resolver.py
│   ├── test_api.py
│   └── test_exporters.py
│
├── config/
│   ├── settings.py                      # App config
│   ├── rules_config.yaml                # Normalization rules
│   └── quality_thresholds.yaml          # QC parameters
│
├── docs/
│   ├── ARCHITECTURE.md                  # System design
│   ├── API_REFERENCE.md                 # API documentation
│   ├── NORMALIZATION_RULES.md           # Data rules
│   ├── QUALITY_CONTROL.md               # QC matrix
│   ├── INTEGRATION_GUIDE.md             # How to integrate
│   └── USER_MANUAL.md                   # End-user guide
│
├── scripts/
│   ├── init_db.py                       # Database setup
│   ├── run_cli.py                       # CLI launcher
│   ├── run_api.py                       # API server launcher
│   ├── run_daemon.py                    # Daemon launcher
│   ├── run_web.py                       # Web UI launcher
│   └── test_normalization.py            # Testing script
│
├── requirements.txt                     # Python dependencies
├── .env.example                         # Environment template
├── docker-compose.yml                   # Multi-container setup
├── Dockerfile                           # Container image
├── README.md                            # Quick start
└── COWORK_PROMPT.md                     # Cowork execution
```

---

## 🧠 NORMALIZATION ENGINE

### Core Components

#### 1. Name Normalization

```
Input: "Pietro d'Agostino", "Pietro D'Agostino", "Pietro Agostino"
       "GIARDINA, Pietro", "Giardina, Pietro Maria"

Output:
{
  "normalized_given": "Pietro",
  "normalized_family": "Giardina",
  "name_variants": ["Pietro d'Agostino", "Pietro D'Agostino", "Pietro Agostino"],
  "confidence": 0.95,
  "source": "Ancestry.com, FamilySearch",
  "changes": [
    "Removed particles (d', di, da)",
    "Standardized capitalization",
    "Extracted given names from family field"
  ]
}
```

**Rules**:
- Remove/standardize particles: d', di, da, del, della, von, van, de
- Separate given names from family names
- Handle hyphenated names
- Standardize capitalization
- Detect name variants (common misspellings)
- Track all variants

#### 2. Date Standardization

```
Input: "ca 1500", "~1505", "1500?", "circa 1510", "abt 1520"
       "15 MAR 1530", "March 15, 1530", "1530-03-15"

Output:
{
  "date_standard": "1500",
  "date_precision": "year",
  "modifiers": ["circa"],
  "confidence": 0.85,
  "source": "Ancestry.com",
  "changes": [
    "Parsed approximate date (ca ~)",
    "Standardized to ISO format",
    "Confidence reduced due to approximation"
  ]
}
```

**Rules**:
- Parse various date formats (GEDCOM, ISO, text)
- Handle approximate dates (ca, ~, abt, circa)
- Validate historical plausibility
- Extract precision (year, month, day)
- Flag impossible dates
- Standard output: YYYY-MM-DD or YYYY

#### 3. Place Normalization

```
Input: "Palermo, Sicily", "Palermo, Italia", "Palermo"
       "Ficarazzi, Sicilia", "Ficcarazzi, Sicilia, Italia"
       "Palermo, (now Italy)"

Output:
{
  "normalized_place": "Palermo, Sicilia, Italia",
  "modern_name": "Palermo, Sicily, Italy",
  "coordinates": [38.115556, 13.361389],
  "historical_variants": ["Palermo", "Palermo, Sicily"],
  "confidence": 0.92,
  "source": "FamilySearch",
  "changes": [
    "Added modern country name",
    "Standardized region name",
    "Geocoded location"
  ]
}
```

**Rules**:
- Standardize place names (historical variants)
- Add geocoding (coordinates)
- Map historical to modern names
- Handle region variations (Sicily/Sicilia)
- Remove parenthetical notes
- Validate against gazetteer

#### 4. Relationship Validation

```
Input:
{
  "husband": "PERS-1920-0001",
  "wife": "PERS-1920-0002",
  "children": ["PERS-1920-0003", "PERS-1920-0004"]
}

Validation:
- ✓ Birth dates: husband (1500) → wife (1505) ✓ (reasonable)
- ✓ Children born after marriage ✓
- ⚠️ Wife age at first child: 15 (flag but valid for 1520s)
- ✓ No circular references (A parent of B, B parent of A)

Output:
{
  "relationships_validated": true,
  "warnings": [
    "Wife very young at first birth (15 years old) - historically plausible but unusual"
  ],
  "confidence": 0.90,
  "changes": ["Validated family relationships"]
}
```

**Rules**:
- Check birth date consistency
- Validate age appropriateness
- Detect circular relationships
- Check for duplicate spouses/children
- Validate against other family members

#### 5. Duplicate Detection

```
Input:
[
  {"id": "REC-001", "name": "Pietro Giardina", "birth": "1500", "place": "Palermo"},
  {"id": "REC-002", "name": "Pietro d'Agostino", "birth": "1500", "place": "Palermo"},
  {"id": "REC-003", "name": "P. Giardina", "birth": "ca 1500", "place": "Palermo, Sicily"}
]

Duplicate Detection:
- REC-001 vs REC-002: 92% similarity (name variant, same dates/place) → MERGE
- REC-001 vs REC-003: 96% similarity (same person, abbreviated name) → MERGE
- Result: 1 consolidated record

Output:
{
  "duplicates_found": 2,
  "merge_confidence": 0.94,
  "recommended_merge": {
    "keep": "REC-001 (Pietro Giardina)",
    "merge_from": ["REC-002", "REC-003"],
    "rationale": "Same person, name variants, identical dates/places",
    "data_to_merge": {
      "name_variants": ["Pietro d'Agostino", "P. Giardina"],
      "sources": ["Ancestry", "FamilySearch", "Local records"]
    }
  }
}
```

**Algorithm**:
- Levenshtein distance (name similarity)
- Date proximity matching (±5 years tolerance)
- Place normalization comparison
- Source cross-validation
- Confidence scoring (weighted factors)

---

## 📊 QUALITY CONTROL SYSTEM

### Confidence Scoring (0-100%)

Each normalized record receives a confidence score based on:

| Factor | Weight | Scoring |
|--------|--------|---------|
| **Data Completeness** | 20% | Missing fields reduce score |
| **Source Quality** | 25% | Primary sources > secondary > unknown |
| **Consistency** | 20% | Internal consistency within record |
| **Conflict Resolution** | 20% | Multiple sources agreement |
| **Domain Validation** | 15% | Rules compliance (dates, places, relationships) |

**Auto-Approval Threshold**: 85%+
**Flag for Review**: < 85%

### Conflict Flagging

Conflicts are categorized:

```
🔴 CRITICAL (must review)
   - Circular relationships (A parent of B, B parent of A)
   - Impossible dates (death before birth)
   - Age inconsistencies (child born 2 years before parent)

🟡 HIGH (should review)
   - Multiple conflicting sources on key facts
   - Incomplete key data
   - Unusual but plausible situations

🟢 LOW (auto-resolvable)
   - Name spelling variants
   - Date approximations
   - Place name variants
   - Minor inconsistencies
```

### Source Attribution

Every normalized value tracks:
```json
{
  "normalized_value": "Pietro Giardina",
  "sources": [
    {
      "source_system": "ancestry.com",
      "source_id": "tree-123456",
      "original_value": "Pietro d'Agostino",
      "confidence": 0.95,
      "date_extracted": "2024-03-15T08:00:00Z"
    },
    {
      "source_system": "familysearch.org",
      "source_id": "tree-789abc",
      "original_value": "Pietro Giardina",
      "confidence": 0.98,
      "date_extracted": "2024-03-15T10:30:00Z"
    }
  ],
  "consolidation_method": "agreement_of_sources",
  "final_confidence": 0.96
}
```

### Audit Trail

Every change is logged:

```
{
  "audit_id": "AUDIT-20240315-001",
  "record_id": "PERS-1920-0001",
  "timestamp": "2024-03-15T12:00:00Z",
  "operation": "normalize_name",
  "before": {
    "given_names": "PIETRO",
    "family_name": "D'AGOSTINO"
  },
  "after": {
    "given_names": "Pietro",
    "family_name": "Giardina"
  },
  "changes": [
    "Standardized capitalization: PIETRO → Pietro",
    "Corrected family name variant: D'Agostino → Giardina (per FamilySearch source)"
  ],
  "confidence": 0.95,
  "auto_approved": true,
  "approval_reason": "High confidence, multiple source agreement",
  "user": "system",
  "revision": 1
}
```

---

## 🔌 API ENDPOINTS (REST)

### Normalization Service

#### POST `/api/v1/normalize`

**Request**:
```json
{
  "input_format": "gedcom",  // or "json", "csv"
  "data": "[raw GEDCOM content or JSON array]",
  "sources": ["Ancestry", "FamilySearch"],
  "auto_approve_threshold": 85,
  "output_format": "gedcom"
}
```

**Response**:
```json
{
  "job_id": "JOB-20240315-001",
  "status": "processing",
  "estimated_completion": "2024-03-15T12:30:00Z",
  "records_submitted": 1247,
  "polling_url": "/api/v1/jobs/JOB-20240315-001"
}
```

#### GET `/api/v1/jobs/{job_id}`

**Response**:
```json
{
  "job_id": "JOB-20240315-001",
  "status": "completed",
  "records_processed": 1247,
  "records_auto_approved": 1156,
  "records_flagged": 91,
  "completion_time": "2024-03-15T12:25:00Z",
  "results_url": "/api/v1/results/JOB-20240315-001",
  "conflicts_url": "/api/v1/conflicts/JOB-20240315-001"
}
```

#### GET `/api/v1/results/{job_id}`

**Response**: Cleaned GEDCOM file (downloadable)

#### GET `/api/v1/conflicts/{job_id}`

**Response**:
```json
{
  "job_id": "JOB-20240315-001",
  "conflicts": [
    {
      "record_id": "PERS-1920-0045",
      "conflict_type": "duplicate",
      "severity": "high",
      "description": "Likely duplicate of PERS-1920-0044",
      "confidence": 0.92,
      "recommendation": "Merge records",
      "manual_review_url": "/api/v1/conflicts/review/CONFLICT-001"
    }
  ],
  "total_conflicts": 91
}
```

#### GET `/api/v1/audit/{record_id}`

**Response**:
```json
{
  "record_id": "PERS-1920-0001",
  "audit_entries": [
    {
      "timestamp": "2024-03-15T12:00:00Z",
      "operation": "normalize_name",
      "before": {"family_name": "D'AGOSTINO"},
      "after": {"family_name": "Giardina"},
      "confidence": 0.95,
      "auto_approved": true
    }
  ]
}
```

---

## 💻 COMMAND LINE INTERFACE (CLI)

### Installation

```bash
pip install -r requirements.txt
python scripts/run_cli.py --help
```

### Commands

#### Normalize batch

```bash
python scripts/run_cli.py normalize \
  --input input.gedcom \
  --sources Ancestry,FamilySearch \
  --output output.gedcom \
  --threshold 85 \
  --report report.json
```

#### Detect duplicates

```bash
python scripts/run_cli.py deduplicate \
  --input data.json \
  --similarity-threshold 0.85 \
  --output duplicates.json
```

#### Generate audit report

```bash
python scripts/run_cli.py audit-report \
  --record-id PERS-1920-0001 \
  --output audit.json
```

#### Validate GEDCOM

```bash
python scripts/run_cli.py validate \
  --input data.gedcom \
  --report validation.json
```

---

## 🌐 WEB USER INTERFACE

### Features

1. **Upload Form**
   - Drag & drop GEDCOM/JSON/CSV
   - Source selection (Ancestry, FamilySearch, other)
   - Settings (threshold, output format)
   - Real-time progress

2. **Results Dashboard**
   - Summary stats (processed, approved, flagged)
   - Quality metrics
   - Download normalized GEDCOM
   - View audit trail

3. **Conflict Review**
   - List flagged records
   - Side-by-side comparison
   - Approve/reject/merge buttons
   - Add comments

4. **Audit Browser**
   - Search change history
   - Filter by type, date, record
   - Export audit reports

---

## ⚙️ DAEMON MODE

### Continuous Monitoring

```bash
python scripts/run_daemon.py \
  --watch-dir /data/incoming \
  --output-dir /data/normalized \
  --threshold 85 \
  --interval 5m
```

**Behavior**:
- Monitors `/data/incoming` for new files
- Automatically normalizes GEDCOM/JSON/CSV
- Outputs clean files to `/data/normalized`
- Generates reports
- Logs all activities
- Moves processed files to `/data/archives`

### Scheduled Tasks

```yaml
# config/scheduler.yaml
tasks:
  - name: "Daily normalization"
    schedule: "0 8 * * *"  # 08:00 daily
    action: "normalize_batch"
    input: "/data/daily_import/*.gedcom"
    output: "/data/normalized/"
    
  - name: "Weekly deduplication"
    schedule: "0 9 * * 0"  # 09:00 Sunday
    action: "deduplicate"
    input: "/data/genealogy.json"
    output: "/data/genealogy_deduped.json"
    
  - name: "Monthly audit cleanup"
    schedule: "0 10 1 * *"  # 10:00 first day
    action: "cleanup_old_audits"
    retention_days: 90
```

---

## 🔗 INTEGRATION POINTS

### With Gestionale 370

**Tab "Data Normalization"** in astro app:
```
/gestionale/normalize

- Upload form for GEDCOM/JSON
- Real-time processing status
- View results
- Review & approve flagged records
- Download cleaned GEDCOM
- View audit trail
```

### With GIARDINA Batch Pipeline

**In batch.py**:
```python
# Step 1: Normalize incoming GEDCOM
from agent import normalize_batch
cleaned_ged = normalize_batch(
    input_file="RECORDS/current.ged",
    sources=["Ancestry", "FamilySearch"],
    threshold=85
)

# Step 2: Process cleaned data
batch.build(cleaned_ged)
batch.ingest()
```

### With Daemon

**Continuous processing**:
```
/data/incoming/*.gedcom
    ↓
Daemon watches folder
    ↓
Automatic normalization (threshold 85%+)
    ↓
/data/normalized/
    ↓
Auto-import to gestionale/GIARDINA
```

---

## 📦 DEPLOYMENT OPTIONS

### Option 1: Standalone Python Script

```bash
cd genealogy-normalization-agent
pip install -r requirements.txt
python scripts/run_cli.py normalize --input data.gedcom --output clean.gedcom
```

### Option 2: REST API Server

```bash
python scripts/run_api.py --host 0.0.0.0 --port 8000
# http://localhost:8000/docs (Swagger UI)
```

### Option 3: Web UI

```bash
python scripts/run_web.py --host 0.0.0.0 --port 5000
# http://localhost:5000
```

### Option 4: Daemon Mode

```bash
python scripts/run_daemon.py --watch-dir /data/incoming --output-dir /data/normalized
```

### Option 5: Docker Compose

```bash
docker-compose up -d
# Runs: API (8000) + Web UI (5000) + Daemon + Database
```

### Option 6: Integration with Cowork

```
Copy COWORK_PROMPT.md content to Cowork
Cowork orchestrates entire setup & testing
```

---

## 📚 DOCUMENTATION FILES

I creerò per te:

1. **ARCHITECTURE.md** - Design & components
2. **API_REFERENCE.md** - Swagger/OpenAPI docs
3. **NORMALIZATION_RULES.md** - Detailed rules per domain
4. **QUALITY_CONTROL.md** - QC matrix & thresholds
5. **INTEGRATION_GUIDE.md** - How to integrate everywhere
6. **USER_MANUAL.md** - End-user instructions
7. **DEPLOYMENT.md** - Setup & operations
8. **COWORK_PROMPT.md** - Execution via Cowork

---

## ✅ IMPLEMENTATION PHASES

### Phase 1: Core Engine (Week 1-2)
- Normalization rules (name, date, place)
- Quality control system
- Confidence scoring

### Phase 2: Backend APIs (Week 3)
- REST API (FastAPI)
- Database setup
- Audit logging

### Phase 3: CLI & Python Script (Week 4)
- Click CLI
- Batch processing
- Export functions

### Phase 4: Web UI (Week 5)
- Flask web interface
- Upload form
- Results dashboard

### Phase 5: Daemon & Scheduling (Week 6)
- Folder monitoring
- Scheduled tasks
- Auto-processing

### Phase 6: Integration (Week 7)
- Gestionale integration
- GIARDINA integration
- End-to-end testing

### Phase 7: Documentation & Deployment (Week 8)
- Complete docs
- Docker setup
- Cowork prompt

---

## 🎯 SUCCESS METRICS

After completion:

✅ Can process 1000+ genealogy records in < 5 minutes  
✅ Achieves 95%+ accuracy on normalization  
✅ Detects 90%+ of duplicates  
✅ Auto-approves 80%+ of records (high confidence)  
✅ Complete audit trail on every change  
✅ Works 5 different ways (CLI, API, Web, Daemon, Cowork)  
✅ Zero data loss or corruption  
✅ Production-ready code

---

**Ready to start?**

I creerò ora:
1. **data_normalization_agent.py** (main engine)
2. **normalization_api.py** (REST API)
3. **normalization_rules.py** (domain logic)
4. **All other components**
5. **Complete documentation**
6. **Cowork execution prompt**

🚀
