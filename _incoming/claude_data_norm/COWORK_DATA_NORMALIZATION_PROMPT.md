# COWORK MASTER PROMPT: Data Normalization Agent Implementation

**Status**: Ready for Codex Execution  
**Scope**: Complete system build (8 components + testing + integration)  
**Duration**: ~8 weeks (phases can run in parallel)  
**Technology**: Python 3.12 + Claude API + FastAPI + Flask + PostgreSQL  
**Output Format**: GEDCOM 5.5.1 + JSON + CSV + Reports  

---

## 🎯 MISSION BRIEF

Build an **intelligent data normalization system** that:
- Cleans genealogical records (names, dates, places, relationships)
- Detects & resolves duplicates across multiple sources
- Maintains complete audit trail & source attribution
- Auto-approves high-confidence (85%+) normalizations
- Flags conflicts for human review
- Works 5 different ways (CLI, REST API, Web UI, Daemon, Cowork)
- Outputs standard GEDCOM format

**Sources**: GEDCOM files, FamilySearch, local files, web forms  
**Autonomy**: Automatic with confidence thresholds  
**Quality Controls**: Confidence scoring, conflict flagging, audit logging  

---

## 📋 EXECUTION PHASES

Execute phases in order. Each phase is self-contained and testable.

---

# PHASE 1: CORE ENGINE & RULES (Week 1-2)

## Objective
Implement the normalization engine, domain rules, and quality control system.

## Tasks

### 1.1 Create Project Structure
```bash
mkdir -p genealogy-normalization-agent/{src,tests,docs,scripts,config}

cd genealogy-normalization-agent

# Create subdirectories
mkdir -p src/{agent,rules,utils,exporters}
mkdir -p config
mkdir -p docs
mkdir -p scripts
mkdir -p tests
```

### 1.2 Create Base Data Models
**File**: `src/agent/data_models.py`

```python
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict

class ConfidenceLevel(Enum):
    VERY_LOW = 0.0
    LOW = 0.25
    MEDIUM = 0.50
    HIGH = 0.75
    VERY_HIGH = 0.95

class ConflictSeverity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

@dataclass
class NormalizationChange:
    field: str
    original_value: str
    normalized_value: str
    rule_applied: str
    confidence: float
    sources: List[str]
    rationale: str

@dataclass
class SourceAttribution:
    source_system: str
    source_id: str
    original_value: str
    confidence: float
    date_extracted: str

@dataclass
class NormalizedPerson:
    person_id: str
    given_names: str
    family_name: str
    name_variants: List[str]
    birth_date: Optional[str]
    birth_place: Optional[str]
    death_date: Optional[str]
    death_place: Optional[str]
    parents: List[str]
    spouse: List[str]
    children: List[str]
    sources: List[SourceAttribution]
    changes: List[NormalizationChange]
    confidence: float
    flagged_for_review: bool
    conflict_reasons: List[str]
    audit_id: str
    processed_at: str
```

**Tasks**:
- [ ] Create all dataclasses
- [ ] Test serialization/deserialization
- [ ] Add validation methods
- [ ] Create JSON schema equivalents

### 1.3 Implement Name Normalization Rules
**File**: `src/rules/name_rules.py`

```python
import re
from typing import Dict, Tuple

class NameNormalizer:
    """
    Normalize genealogical names:
    - Remove particles (d', di, da, del, della, von, van, de)
    - Standardize capitalization
    - Handle hyphenated names
    - Extract variants
    """
    
    PARTICLES = ['d\'', 'di', 'da', 'del', 'della', 'von', 'van', 'de', 'des']
    
    @staticmethod
    def normalize(given_names: str, family_name: str) -> Dict:
        """
        Input: "Pietro d'Agostino", "GIARDINA"
        Output: {
            "given_names": "Pietro",
            "family_name": "Giardina",
            "variants": ["d'Agostino", "D'Agostino"],
            "confidence": 0.95,
            "changes": [...]
        }
        """
        changes = []
        
        # Normalize capitalization
        normalized_given = given_names.title() if given_names else ""
        normalized_family = family_name.title() if family_name else ""
        
        # Remove particles from family name
        for particle in NameNormalizer.PARTICLES:
            if normalized_family.lower().startswith(particle.lower()):
                normalized_family = normalized_family[len(particle):].strip()
                changes.append(f"Removed particle '{particle}'")
        
        # Calculate confidence
        confidence = 0.95 if changes else 0.98
        
        return {
            "given_names": normalized_given,
            "family_name": normalized_family,
            "variants": [given_names, family_name],
            "confidence": confidence,
            "changes": changes
        }
    
    @staticmethod
    def extract_variants(name: str) -> List[str]:
        """Extract common variants of a name"""
        variants = []
        # Add logic for common misspellings, abbreviations, etc
        return variants
```

**Tasks**:
- [ ] Implement particle removal
- [ ] Handle Italian naming conventions (common for Sicilian)
- [ ] Extract common variants (Pietro → Pete, Petro, etc)
- [ ] Write tests for edge cases
- [ ] Add confidence scoring logic

### 1.4 Implement Date Normalization Rules
**File**: `src/rules/date_rules.py`

```python
import re
from datetime import datetime
from typing import Dict, Optional

class DateNormalizer:
    """
    Standardize genealogical dates:
    - Parse: "ca 1500", "~1505", "1500?", "1500-03-15", "15 MAR 1500"
    - Output: ISO format YYYY-MM-DD or YYYY
    - Track precision: year, month, day
    - Handle approximations: circa, about, estimated
    """
    
    @staticmethod
    def normalize(date_str: str) -> Dict:
        """
        Input: "ca 1500", "March 15, 1500", "1500-03-15"
        Output: {
            "date": "1500",
            "precision": "year",
            "modifiers": ["circa"],
            "confidence": 0.85,
            "changes": [...]
        }
        """
        if not date_str:
            return {"date": None, "precision": None, "confidence": 0.0}
        
        changes = []
        modifiers = []
        confidence = 0.95
        
        # Remove modifiers
        normalized = date_str.strip()
        for prefix in ['ca', 'c.', 'circa', 'abt', 'about', '~']:
            if normalized.lower().startswith(prefix):
                modifiers.append(prefix)
                normalized = normalized[len(prefix):].strip()
                confidence -= 0.1
        
        # Remove trailing ? or ?
        if normalized.endswith('?'):
            modifiers.append('uncertain')
            normalized = normalized[:-1].strip()
            confidence -= 0.05
        
        # Parse different formats
        # Try ISO format first: YYYY-MM-DD
        if re.match(r'\d{4}-\d{2}-\d{2}', normalized):
            return {
                "date": normalized,
                "precision": "day",
                "modifiers": modifiers,
                "confidence": confidence,
                "changes": changes
            }
        
        # Try year only: YYYY or YYYY-MM
        year_match = re.search(r'\d{4}', normalized)
        if year_match:
            return {
                "date": year_match.group(),
                "precision": "year",
                "modifiers": modifiers,
                "confidence": confidence,
                "changes": changes
            }
        
        # Unknown format
        return {
            "date": None,
            "precision": None,
            "modifiers": modifiers,
            "confidence": 0.0,
            "changes": ["Could not parse date"]
        }
```

**Tasks**:
- [ ] Parse multiple date formats
- [ ] Handle approximations (ca, ~, abt)
- [ ] Extract precision (year, month, day)
- [ ] Validate historical plausibility
- [ ] Add uncertainty tracking
- [ ] Write comprehensive tests

### 1.5 Implement Place Normalization Rules
**File**: `src/rules/place_rules.py`

```python
class PlaceNormalizer:
    """
    Normalize genealogical places:
    - Standardize names (Sicilia → Sicily)
    - Add modern equivalents
    - Track historical variants
    - Extract geocoding (latitude, longitude)
    """
    
    # Historical place variants
    HISTORICAL_VARIANTS = {
        "Palermo": ["Palermo", "Palermo, Sicily", "Palermo, Sicilia"],
        "Ficarazzi": ["Ficarazzi", "Ficcarazzi", "Ficarazzi, Sicily"],
        # ... more variants
    }
    
    GEOCODING = {
        "Palermo": {"lat": 38.115556, "lon": 13.361389},
        # ... more locations
    }
    
    @staticmethod
    def normalize(place: str) -> Dict:
        """
        Input: "Palermo, Sicily", "Palermo", "Palermo, Italy"
        Output: {
            "normalized": "Palermo, Sicilia, Italia",
            "modern_name": "Palermo, Sicily, Italy",
            "coordinates": [38.115556, 13.361389],
            "confidence": 0.92,
            "variants": [...]
        }
        """
        # Implementation
        pass
```

**Tasks**:
- [ ] Build place name database (especially Sicilian locations)
- [ ] Implement historical variant matching
- [ ] Add geocoding
- [ ] Handle region/country name variations
- [ ] Test with Italian/Sicilian locations

### 1.6 Implement Relationship Validation
**File**: `src/rules/relationship_rules.py`

```python
class RelationshipValidator:
    """
    Validate genealogical relationships:
    - Check birth date consistency
    - Validate age appropriateness
    - Detect circular references
    - Check for duplicate relationships
    """
    
    @staticmethod
    def validate_parent_child(parent: dict, child: dict) -> Dict:
        """
        Check if parent-child relationship is plausible
        """
        issues = []
        
        # Check ages
        if parent.get("birth_date") and child.get("birth_date"):
            parent_year = int(parent["birth_date"].split("-")[0])
            child_year = int(child["birth_date"].split("-")[0])
            age_at_birth = child_year - parent_year
            
            if age_at_birth < 12:
                issues.append(f"Parent too young ({age_at_birth} years)")
            elif age_at_birth > 70:
                issues.append(f"Parent very old ({age_at_birth} years) - unusual")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "confidence": 0.9 if not issues else 0.6
        }
```

**Tasks**:
- [ ] Implement parent-child validation
- [ ] Implement spouse validation
- [ ] Check for circular relationships
- [ ] Validate against all family members
- [ ] Add historical context (different ages acceptable in different eras)

### 1.7 Implement Quality Control System
**File**: `src/agent/quality_control.py`

```python
class QualityControl:
    """
    Calculate confidence scores and validate data quality
    
    Scoring factors (0-1):
    - Data completeness: 20%
    - Source quality: 25%
    - Consistency: 20%
    - Conflict resolution: 20%
    - Domain validation: 15%
    """
    
    @staticmethod
    def calculate_confidence(normalized_person: dict) -> float:
        """Calculate overall confidence score (0-1)"""
        
        scores = {
            "completeness": QualityControl._score_completeness(normalized_person),
            "source_quality": QualityControl._score_source_quality(normalized_person),
            "consistency": QualityControl._score_consistency(normalized_person),
            "conflict_resolution": QualityControl._score_conflicts(normalized_person),
            "domain_validation": QualityControl._score_domain(normalized_person)
        }
        
        weights = {
            "completeness": 0.20,
            "source_quality": 0.25,
            "consistency": 0.20,
            "conflict_resolution": 0.20,
            "domain_validation": 0.15
        }
        
        total = sum(scores[k] * weights[k] for k in scores)
        return min(max(total, 0.0), 1.0)
    
    @staticmethod
    def _score_completeness(person: dict) -> float:
        """Score based on field completeness"""
        fields = ["given_names", "family_name", "birth_date", "birth_place"]
        present = sum(1 for f in fields if person.get(f))
        return present / len(fields)
    
    # ... other scoring methods
```

**Tasks**:
- [ ] Implement confidence scoring algorithm
- [ ] Add weightable factors
- [ ] Test scoring logic
- [ ] Validate thresholds

### 1.8 Write Comprehensive Tests
**File**: `tests/test_normalization.py`

```python
import pytest
from src.rules.name_rules import NameNormalizer
from src.rules.date_rules import DateNormalizer
from src.rules.place_rules import PlaceNormalizer

def test_name_normalization():
    result = NameNormalizer.normalize("PIETRO", "D'AGOSTINO")
    assert result["family_name"] == "Agostino"
    assert result["confidence"] >= 0.85

def test_date_parsing():
    result = DateNormalizer.normalize("ca 1500")
    assert result["date"] == "1500"
    assert "circa" in result["modifiers"]
    assert result["confidence"] < 1.0

def test_place_normalization():
    result = PlaceNormalizer.normalize("Palermo, Sicily")
    assert "Sicilia" in result["normalized"] or "Italy" in result["modern_name"]

def test_sicilian_names():
    """Test Sicilian-specific name handling"""
    # Add test cases for Giardina, Grimaldi, Naselli, etc
    pass
```

**Tasks**:
- [ ] Write unit tests for each rule
- [ ] Test Sicilian-specific cases
- [ ] Add edge case tests
- [ ] Verify confidence scoring
- [ ] Run full test suite

---

## ✅ PHASE 1 DELIVERABLES

After Phase 1 completion, Codex should report:

```
PHASE 1 COMPLETION REPORT
========================

✓ Project structure created
✓ Data models implemented (5 dataclasses)
✓ Name normalization rules complete
✓ Date normalization rules complete
✓ Place normalization rules complete (with Sicilian locations)
✓ Relationship validation complete
✓ Quality control system complete
✓ Unit tests written & passing

Metrics:
- 6 Python modules created
- 25+ test cases written
- 100% test pass rate
- 150+ lines of core logic
- Confidence scoring validated (0-1 range)

Next Phase: REST API Implementation
```

---

# PHASE 2: DATA NORMALIZATION ENGINE (Week 2-3)

## Objective
Implement the main orchestration engine that uses Claude API for intelligent normalization.

## Tasks

### 2.1 Create Main Normalization Engine
**File**: `src/agent/normalization_engine.py`

- [ ] `DataNormalizationEngine` class with Claude API integration
- [ ] Async batch processing method
- [ ] Prompt engineering for Claude
- [ ] Response parsing & validation
- [ ] Error handling & retry logic
- [ ] Logging & monitoring

### 2.2 Implement Duplicate Detection
**File**: `src/agent/duplicate_detection.py`

- [ ] Levenshtein string similarity
- [ ] Date proximity matching (±5 years tolerance)
- [ ] Place name comparison
- [ ] Confidence-based duplicate scoring
- [ ] Merge recommendation logic
- [ ] Deduplication algorithms

### 2.3 Implement Conflict Resolver
**File**: `src/agent/conflict_resolver.py`

- [ ] Categorize conflicts (critical, high, medium, low)
- [ ] Flag resolution strategies
- [ ] Multi-source agreement logic
- [ ] Merge multiple records
- [ ] Preserve source attribution during merge

### 2.4 Implement Audit Logger
**File**: `src/agent/audit_logger.py`

- [ ] Log every change with timestamp
- [ ] Track original → normalized values
- [ ] Record confidence scores
- [ ] Track sources for each value
- [ ] Generate audit reports
- [ ] Support audit retrieval by record ID

### 2.5 Create Configuration System
**File**: `config/settings.py`

- [ ] Load from environment variables
- [ ] Support multiple environments (dev/test/prod)
- [ ] Configure thresholds (auto-approve, conflict flag)
- [ ] Configure API keys (Claude, database)
- [ ] Configure logging levels
- [ ] Create .env.example template

### 2.6 Write Integration Tests
**File**: `tests/test_engine.py`

- [ ] Test full normalization pipeline
- [ ] Test batch processing
- [ ] Test Claude API integration
- [ ] Test duplicate detection
- [ ] Test audit logging
- [ ] Test error handling

---

## ✅ PHASE 2 DELIVERABLES

```
PHASE 2 COMPLETION REPORT
========================

✓ DataNormalizationEngine implemented
✓ Async batch processing working
✓ Claude API integration complete
✓ Duplicate detection functional
✓ Conflict resolution system complete
✓ Audit logging operational
✓ Configuration system in place
✓ Integration tests passing

Metrics:
- 400+ lines of engine code
- Batch processing: 1000 records in ~4 minutes
- Duplicate detection: 92% accuracy
- Confidence scoring: validated
- Zero data loss in tests
- All async operations working

Next Phase: REST API Endpoint
```

---

# PHASE 3: REST API IMPLEMENTATION (Week 3-4)

## Objective
Build FastAPI REST server for remote normalization service.

## Tasks

### 3.1 Create FastAPI Application
**File**: `src/api/server.py`

- [ ] FastAPI app setup
- [ ] CORS configuration
- [ ] Middleware (auth, logging, error handling)
- [ ] Health check endpoint
- [ ] Startup/shutdown events

### 3.2 Implement API Endpoints
**File**: `src/api/routes.py`

- [ ] `POST /api/v1/normalize` - Submit batch for processing
- [ ] `GET /api/v1/jobs/{job_id}` - Check job status
- [ ] `GET /api/v1/results/{job_id}` - Download results
- [ ] `GET /api/v1/conflicts/{job_id}` - Get flagged records
- [ ] `GET /api/v1/audit/{record_id}` - View audit trail
- [ ] `PATCH /api/v1/conflicts/{conflict_id}` - Resolve conflict
- [ ] Swagger/OpenAPI documentation

### 3.3 Database Integration
**File**: `src/utils/database.py`

- [ ] PostgreSQL/SQLite setup
- [ ] Job tracking table
- [ ] Results storage
- [ ] Audit log table
- [ ] Migrations
- [ ] Connection pooling

### 3.4 Request/Response Schemas
**File**: `src/api/schemas.py`

- [ ] Pydantic models for requests/responses
- [ ] Validation logic
- [ ] Error response schemas
- [ ] OpenAPI documentation

### 3.5 Write API Tests
**File**: `tests/test_api.py`

- [ ] Test all endpoints
- [ ] Test authentication (if needed)
- [ ] Test error handling
- [ ] Test concurrent requests
- [ ] Load testing
- [ ] Database integration tests

---

## ✅ PHASE 3 DELIVERABLES

```
PHASE 3 COMPLETION REPORT
========================

✓ FastAPI server running
✓ All endpoints implemented
✓ Database connected
✓ Swagger UI working
✓ Error handling in place
✓ API tests passing

Metrics:
- 6 API endpoints operational
- Response time < 500ms
- Concurrent request handling: 10+ simultaneous
- Database: 100+ test records
- Test coverage: 90%+

API Documentation: /api/v1/docs

Next Phase: CLI Implementation
```

---

# PHASE 4: COMMAND LINE INTERFACE (Week 4)

## Objective
Build Click-based CLI for standalone execution.

## Tasks

### 4.1 Create CLI Application
**File**: `src/cli/cli.py`

- [ ] Click command group
- [ ] Configuration loading
- [ ] Logging setup
- [ ] Progress indication
- [ ] Error messages

### 4.2 Implement CLI Commands
**File**: `src/cli/commands.py`

- [ ] `normalize` - Normalize GEDCOM/JSON/CSV file
- [ ] `deduplicate` - Detect duplicates
- [ ] `validate` - Validate GEDCOM syntax
- [ ] `audit-report` - Generate audit trail
- [ ] `merge-records` - Merge duplicate records
- [ ] `export` - Export in different formats

### 4.3 Output Formatters
**File**: `src/cli/formatters.py`

- [ ] Table formatting
- [ ] JSON output
- [ ] CSV output
- [ ] Progress bars
- [ ] Color-coded output

### 4.4 Write CLI Tests
**File**: `tests/test_cli.py`

- [ ] Test each command
- [ ] Test file handling
- [ ] Test error cases
- [ ] Test output formats

---

## ✅ PHASE 4 DELIVERABLES

```
PHASE 4 COMPLETION REPORT
========================

✓ CLI application working
✓ All commands implemented
✓ Help documentation complete
✓ Tests passing

Metrics:
- 6 CLI commands available
- File I/O working (GEDCOM, JSON, CSV)
- Output formatting: 3 formats
- Error handling: comprehensive

Usage: python -m src.cli.cli --help

Next Phase: Web UI Implementation
```

---

# PHASE 5: WEB USER INTERFACE (Week 5)

## Objective
Build Flask web application for browser-based access.

## Tasks

### 5.1 Create Flask Application
**File**: `src/web/app.py`

- [ ] Flask app setup
- [ ] Configuration
- [ ] Static/template directories
- [ ] Session handling

### 5.2 Create Web Templates
**File**: `src/web/templates/`

- [ ] `base.html` - Layout template
- [ ] `upload.html` - File upload form
- [ ] `results.html` - Results display
- [ ] `conflicts.html` - Conflict review
- [ ] `audit.html` - Audit trail viewer

### 5.3 Implement Web Routes
**File**: `src/web/routes.py`

- [ ] POST `/upload` - Accept file upload
- [ ] GET `/status/{job_id}` - Job status
- [ ] GET `/results/{job_id}` - View results
- [ ] GET `/conflicts/{job_id}` - Review conflicts
- [ ] PATCH `/conflicts/{conflict_id}` - Resolve conflict
- [ ] GET `/audit/{record_id}` - View audit trail

### 5.4 Frontend Styling & JavaScript
**File**: `src/web/static/`

- [ ] CSS styling (CRT theme matching gestionale)
- [ ] JavaScript for interactivity
- [ ] Progress indication
- [ ] Form validation
- [ ] Real-time updates (optional WebSocket)

### 5.5 Write Web Tests
**File**: `tests/test_web.py`

- [ ] Test file upload
- [ ] Test form submission
- [ ] Test page rendering
- [ ] Test JavaScript functionality

---

## ✅ PHASE 5 DELIVERABLES

```
PHASE 5 COMPLETION REPORT
========================

✓ Flask web app running
✓ File upload working
✓ Results display complete
✓ Conflict review UI functional
✓ Styling complete
✓ Tests passing

Metrics:
- 6 web pages created
- File upload: 100MB limit
- Session management: working
- Real-time updates: optional

URL: http://localhost:5000

Next Phase: Daemon Implementation
```

---

# PHASE 6: DAEMON MODE (Week 6)

## Objective
Build continuous folder monitoring for automatic processing.

## Tasks

### 6.1 Create Daemon Core
**File**: `src/daemon/monitor.py`

- [ ] Watch directory for new files
- [ ] Process new GEDCOM/JSON/CSV files
- [ ] Automatic normalization
- [ ] Output to configured directory
- [ ] Archive processed files

### 6.2 Implement Scheduler
**File**: `src/daemon/scheduler.py`

- [ ] APScheduler setup
- [ ] Scheduled batch jobs
- [ ] Cron expression support
- [ ] Job logging
- [ ] Error notifications

### 6.3 Async Task Queue
**File**: `src/daemon/queue.py`

- [ ] Optional: Celery/RQ integration
- [ ] Background job processing
- [ ] Retry logic
- [ ] Priority queue

### 6.4 Health Monitoring
**File**: `src/daemon/health.py`

- [ ] CPU/Memory monitoring
- [ ] File system space checks
- [ ] Database connection health
- [ ] API endpoint checks
- [ ] Alert system

### 6.5 Daemon Tests
**File**: `tests/test_daemon.py`

- [ ] Test file watching
- [ ] Test processing
- [ ] Test scheduling
- [ ] Test health checks

---

## ✅ PHASE 6 DELIVERABLES

```
PHASE 6 COMPLETION REPORT
========================

✓ Daemon implemented
✓ Folder monitoring working
✓ Automatic processing functional
✓ Scheduler operational
✓ Health checks in place
✓ Tests passing

Metrics:
- Watch interval: 5 minutes
- Processing: 1000 records/5 min
- Uptime: continuous
- Health monitoring: active

Daemon running: systemd/supervisor

Next Phase: Integration
```

---

# PHASE 7: INTEGRATION & EXPORTERS (Week 6-7)

## Objective
Implement GEDCOM export, integration with gestionale and GIARDINA, and complete all connectors.

## Tasks

### 7.1 GEDCOM Exporter
**File**: `src/exporters/gedcom_exporter.py`

- [ ] Convert normalized records to GEDCOM 5.5.1
- [ ] Source attribution in GEDCOM
- [ ] Relationship encoding
- [ ] Date handling
- [ ] Place encoding
- [ ] Valid GEDCOM output

### 7.2 Gestionale Integration
**File**: `src/integrations/gestionale_integration.py`

- [ ] REST API calls to gestionale
- [ ] Data sync with gestionale database
- [ ] Conflict resolution UI integration
- [ ] Real-time updates to gestionale

### 7.3 GIARDINA Integration
**File**: `src/integrations/giardina_integration.py`

- [ ] Input: GIARDINA batch output (current.ged)
- [ ] Normalization before GIARDINA processing
- [ ] Feedback loop: updated records back to GIARDINA
- [ ] Audit trail integration

### 7.4 Cowork Integration (Optional)
**File**: `src/integrations/cowork_integration.py`

- [ ] Cowork prompt handling
- [ ] Status reporting back to Cowork
- [ ] Result delivery
- [ ] Error reporting

### 7.5 CSV & JSON Exporters
**File**: `src/exporters/{csv,json}_exporter.py`

- [ ] Export to CSV (for spreadsheets)
- [ ] Export to JSON (for gestionale)
- [ ] Audit trail export

### 7.6 Integration Tests
**File**: `tests/test_integration.py`

- [ ] Test gestionale integration
- [ ] Test GIARDINA integration
- [ ] Test GEDCOM export
- [ ] End-to-end workflow

---

## ✅ PHASE 7 DELIVERABLES

```
PHASE 7 COMPLETION REPORT
========================

✓ GEDCOM exporter working
✓ Gestionale integration complete
✓ GIARDINA integration tested
✓ CSV/JSON export functional
✓ Cowork integration ready
✓ All integrations tested

Metrics:
- GEDCOM output: valid 5.5.1
- Export formats: 3 (GEDCOM, JSON, CSV)
- Integration points: 3 (gestionale, GIARDINA, Cowork)
- End-to-end: fully functional

Next Phase: Testing & Documentation
```

---

# PHASE 8: TESTING, DOCUMENTATION & DEPLOYMENT (Week 7-8)

## Objective
Complete testing, documentation, and prepare for production deployment.

## Tasks

### 8.1 Comprehensive Testing
**File**: `tests/`

- [ ] Unit tests: 50+
- [ ] Integration tests: 20+
- [ ] API tests: 15+
- [ ] End-to-end tests: 10+
- [ ] Load testing: 1000+ records
- [ ] Performance profiling
- [ ] Coverage: 90%+

### 8.2 Documentation
**File**: `docs/`

- [ ] API_REFERENCE.md - Swagger/OpenAPI
- [ ] ARCHITECTURE.md - System design
- [ ] NORMALIZATION_RULES.md - Domain logic
- [ ] INTEGRATION_GUIDE.md - How to integrate
- [ ] USER_MANUAL.md - End-user guide
- [ ] DEPLOYMENT.md - Setup & ops
- [ ] TROUBLESHOOTING.md - Common issues

### 8.3 Docker Setup
**File**: `Dockerfile`, `docker-compose.yml`

- [ ] Python 3.12 base image
- [ ] FastAPI service
- [ ] Flask web service
- [ ] PostgreSQL database
- [ ] Redis cache (optional)
- [ ] Volumes for data persistence

### 8.4 GitHub & CI/CD
**File**: `.github/workflows/`

- [ ] GitHub Actions CI pipeline
- [ ] Automated testing on push
- [ ] Linting & formatting
- [ ] Docker image build
- [ ] Deployment automation

### 8.5 Cowork Execution Prompt
**File**: `COWORK_PROMPT.md`

- [ ] Complete prompt for system setup
- [ ] Testing procedures
- [ ] Verification checklist
- [ ] Troubleshooting guide

---

## ✅ PHASE 8 DELIVERABLES

```
PHASE 8 COMPLETION REPORT
========================

✓ 100+ tests written & passing
✓ Test coverage: 92%
✓ All documentation complete
✓ Docker setup ready
✓ CI/CD pipeline working
✓ System production-ready

Metrics:
- Test suite: 100+ tests
- Code coverage: 92%
- Documentation: 8 guides
- Docker: 5 containers
- Performance: <500ms API response

SYSTEM READY FOR PRODUCTION

Final Status: ✅ COMPLETE
```

---

## 📊 COMPLETION CHECKLIST

After ALL 8 phases, Codex should verify:

### Core Implementation
- [ ] All 8 Python modules created
- [ ] 500+ lines of production code
- [ ] Complete test suite (100+ tests)
- [ ] 92%+ code coverage

### Features
- [ ] Batch processing (1000+ records in 5 min)
- [ ] Duplicate detection (92% accuracy)
- [ ] Auto-approval (85% threshold)
- [ ] Conflict flagging (complete)
- [ ] Audit trail (all changes logged)
- [ ] Source attribution (tracked)

### Interfaces
- [ ] REST API (6 endpoints)
- [ ] CLI (6 commands)
- [ ] Web UI (6 pages)
- [ ] Daemon (continuous monitoring)
- [ ] Integration (gestionale + GIARDINA + Cowork)

### Quality
- [ ] Zero data loss in testing
- [ ] 100% test pass rate
- [ ] <500ms API response time
- [ ] Concurrent request handling
- [ ] Error handling complete
- [ ] Logging comprehensive

### Documentation
- [ ] Architecture guide
- [ ] API reference
- [ ] User manual
- [ ] Integration guide
- [ ] Deployment guide
- [ ] Troubleshooting guide

### Deployment
- [ ] Docker images built
- [ ] Docker compose working
- [ ] CI/CD pipeline functional
- [ ] Production configuration ready

---

## 🎯 REPORTING REQUIREMENTS

After EACH phase, Codex must report:

```
PHASE X COMPLETION REPORT
========================

✓ Task 1: [COMPLETED/PARTIAL/BLOCKED]
✓ Task 2: [COMPLETED/PARTIAL/BLOCKED]
...

Code Created:
- file1.py (X lines)
- file2.py (X lines)
- Total: X lines

Tests Written:
- X unit tests
- X integration tests
- X passing
- X failed (if any)

Metrics:
- Performance: X ms
- Coverage: X%
- Uptime: X%

Issues Encountered:
- [List any blockers]

Next Steps:
- Phase X+1 preparations

Dependencies Met:
- ✓ All upstream tasks complete
- ✓ Ready for next phase
```

---

## 🚀 HOW TO USE THIS PROMPT

1. **Copy entire prompt to Codex**
2. **Execute Phase 1** - Report when complete
3. **Review report** - Verify deliverables
4. **Execute Phase 2** - Continue sequentially
5. **After Phase 8** - System is production-ready

**Do NOT skip phases!** Each builds on previous.

---

## 📞 ESCALATION PROCEDURE

If Codex encounters blockers:

1. **Describe the issue** - What's blocking?
2. **Attempt workaround** - Try alternative approach
3. **Report back** - What was tried, what failed
4. **I'll advise** - Provide guidance or modification
5. **Continue** - Proceed with next phase

---

**Status**: 🟢 READY FOR CODEX EXECUTION

Start with Phase 1. Report completion for each phase before moving to next.

Good luck, Codex! 🚀🧬
