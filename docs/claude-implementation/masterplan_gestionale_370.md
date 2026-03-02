# MASTERPLAN: Gestionale 370-Style per FineDiMondo/Genealogia

**Versione**: 1.0  
**Data**: 2024-03-15  
**Scope**: Design System + Architettura + Documentazione Tecnico-Funzionale  
**Stack**: HTML5 + Vanilla JS + Astro PWA  
**Ambienti**: Dev / Test / Staging / Produzione  
**Estetica**: CRT Verde/Ambra + Mainframe 370 Elegante  

---

## 📑 INDICE COMPLETO

1. [VISIONE & CONCEPT](#visione--concept)
2. [DESIGN SYSTEM](#design-system)
3. [ARCHITETTURA SOFTWARE](#architettura-software)
4. [FEATURE SPECIFICATION](#feature-specification)
5. [TECHNICAL ARCHITECTURE](#technical-architecture)
6. [IMPLEMENTATION ROADMAP](#implementation-roadmap)
7. [DOCUMENTAZIONE DETTAGLIATA](#documentazione-dettagliata)
8. [COWORK EXECUTION PLAN](#cowork-execution-plan)

---

## VISIONE & CONCEPT

### 🎨 Design Philosophy

**Inspirazione**: IBM System/370 (1970s) + Modernità (2020s)

**Principi**:
- **Minimalismo funzionale** - Ogni pixel ha scopo
- **Trasparenza logica** - Data flow visibile
- **Eleganza formale** - Mainframe ma raffinato
- **Accessibilità** - CRT ma leggibile
- **Performance** - Vanilla JS, zero bloat

**Promessa**: Un'interfaccia che ti trasporta negli '80, ma con UX contemporanea.

### 🎯 User Personas

| Persona | Goal | Context |
|---------|------|---------|
| **Genealogista (Daniel)** | Manage genealogical data, track GEDCOM sync, run batch processes | Principale utente, technical background |
| **Ricercatore** | Search & filter family records, visualize relationships | Accesso read-only, focus su search |
| **Data Admin** | Monitor pipeline, configure GEDCOM sync, manage environments | Occasional, needs visibility |
| **Future Team Member** | Understand data flow, contribute to COBOL logic | Onboarding support required |

### 📊 Success Metrics

- ✅ **Engagement**: Data entry 10x faster than text files
- ✅ **Reliability**: Zero data loss across test/staging/prod
- ✅ **Clarity**: COBOL data flow visible and understandable
- ✅ **Maintainability**: Code readable, documented, testable
- ✅ **Performance**: Load < 200ms, no framework overhead

---

## DESIGN SYSTEM

### 🎨 Visual Identity

#### Color Palette: CRT Classico

```css
/* Primary CRT Colors */
--crt-green: #00FF00;           /* Main text, highlights */
--crt-amber: #FFAA00;           /* Warnings, accents */
--crt-black: #000000;           /* Background */
--crt-dark-green: #003300;      /* Secondary background */
--crt-white: #CCCCCC;           /* Secondary text */

/* Extended Palette */
--crt-bright-green: #00FF33;    /* Active states */
--crt-dim-green: #006600;       /* Disabled states */
--crt-cyan: #00FFFF;            /* Info, secondary */
--crt-red: #FF0000;             /* Errors */
--crt-orange: #FF6600;          /* Warnings */

/* Semantic */
--color-success: var(--crt-green);
--color-warning: var(--crt-amber);
--color-error: var(--crt-red);
--color-info: var(--crt-cyan);
--color-text-primary: var(--crt-green);
--color-text-secondary: var(--crt-white);
--color-bg-primary: var(--crt-black);
--color-bg-secondary: var(--crt-dark-green);
--color-border: var(--crt-green);
```

#### Typography

```css
/* Display Font: Courier Prime (Monospace Retro) */
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');

/* Body Font: IBM Plex Mono (Technical) */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

--font-display: 'Courier Prime', monospace;    /* Headers, titles */
--font-body: 'IBM Plex Mono', monospace;       /* Body text, data */
--font-code: 'IBM Plex Mono', monospace;       /* Code blocks */

/* Font Sizes */
--fs-h1: clamp(1.5rem, 2.5vw, 2.5rem);        /* Page titles */
--fs-h2: clamp(1.25rem, 2vw, 2rem);           /* Section headers */
--fs-h3: clamp(1rem, 1.5vw, 1.25rem);         /* Subsection */
--fs-body: 0.95rem;                            /* Body text */
--fs-small: 0.85rem;                           /* Labels, metadata */
--fs-code: 0.9rem;                             /* Code blocks */

/* Line Height (important for readability) */
--lh-tight: 1.2;
--lh-normal: 1.5;
--lh-relaxed: 1.8;
```

#### Spacing System (8px base)

```css
--space-xs: 0.25rem;    /* 4px */
--space-sm: 0.5rem;     /* 8px */
--space-md: 1rem;       /* 16px */
--space-lg: 1.5rem;     /* 24px */
--space-xl: 2rem;       /* 32px */
--space-2xl: 3rem;      /* 48px */
--space-3xl: 4rem;      /* 64px */

/* Grid alignment */
--grid-cols: 12;
--grid-gap: var(--space-md);
```

#### Visual Effects: CRT Scan Lines

```css
/* CRT Scan Lines Effect */
@keyframes scanlines {
    0%, 100% { opacity: 0.03; }
    50% { opacity: 0.05; }
}

.crt-screen {
    background: radial-gradient(ellipse at center, #111 0%, #000 100%);
    position: relative;
}

.crt-screen::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
        0deg,
        rgba(0, 255, 0, 0.03),
        rgba(0, 255, 0, 0.03) 1px,
        transparent 1px,
        transparent 2px
    );
    pointer-events: none;
    animation: scanlines 8s linear infinite;
}

.crt-screen::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
    pointer-events: none;
}
```

#### Border & Container Styles

```css
/* Mainframe-style borders (double line) */
.container-primary {
    border: 2px solid var(--crt-green);
    border-right: 3px solid var(--crt-amber);
    border-bottom: 3px solid var(--crt-amber);
    background: var(--crt-dark-green);
    padding: var(--space-lg);
    position: relative;
}

.container-primary::before {
    content: '';
    position: absolute;
    inset: -1px;
    border: 1px solid var(--crt-green);
    pointer-events: none;
    opacity: 0.5;
}

/* Panel/Card style */
.panel {
    border: 1px solid var(--crt-green);
    background: rgba(0, 51, 0, 0.5);
    padding: var(--space-md);
    position: relative;
}

.panel.active {
    border-color: var(--crt-amber);
    background: rgba(0, 51, 0, 0.8);
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
}
```

### 🧩 Component Library

#### 1. Button Component

```html
<!-- HTML -->
<button class="btn btn-primary">
    <span class="btn-label">EXECUTE</span>
    <span class="btn-state">[ ]</span>
</button>

<button class="btn btn-secondary">CANCEL</button>
<button class="btn btn-danger">DELETE</button>
<button class="btn btn-disabled" disabled>LOCKED</button>
```

```css
/* CSS */
.btn {
    font-family: var(--font-display);
    font-size: var(--fs-body);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--crt-green);
    background: var(--crt-dark-green);
    color: var(--crt-green);
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.15s ease;
    position: relative;
    overflow: hidden;
}

.btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: var(--crt-green);
    z-index: -1;
    transition: left 0.15s ease;
}

.btn:hover::before {
    left: 0;
}

.btn:hover {
    color: var(--crt-black);
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.4);
}

.btn:active {
    transform: translate(1px, 1px);
}

.btn-primary {
    border-color: var(--crt-green);
}

.btn-secondary {
    border-color: var(--crt-white);
    color: var(--crt-white);
}

.btn-secondary::before {
    background: var(--crt-white);
}

.btn-danger {
    border-color: var(--crt-red);
    color: var(--crt-red);
}

.btn-danger::before {
    background: var(--crt-red);
}

.btn-disabled,
.btn:disabled {
    border-color: var(--crt-dim-green);
    color: var(--crt-dim-green);
    cursor: not-allowed;
    opacity: 0.5;
}

.btn-state {
    margin-left: var(--space-sm);
    font-size: 0.8em;
}

.btn.loading .btn-state::after {
    content: '▓';
    animation: pulse 0.5s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
}
```

#### 2. Input/Form Component

```html
<!-- HTML -->
<div class="form-group">
    <label class="form-label">RECORD ID:</label>
    <input type="text" class="form-input" placeholder="Enter ID" />
    <div class="form-hint">Format: PERS-YYYY-NNNN</div>
</div>

<div class="form-group">
    <label class="form-label">STATUS:</label>
    <select class="form-select">
        <option value="">-- SELECT --</option>
        <option value="active">ACTIVE</option>
        <option value="inactive">INACTIVE</option>
    </select>
</div>

<div class="form-group">
    <label class="form-checkbox">
        <input type="checkbox" />
        <span>CONFIRM ACTION</span>
    </label>
</div>
```

```css
.form-group {
    margin-bottom: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.form-label {
    font-family: var(--font-display);
    font-size: var(--fs-small);
    color: var(--crt-green);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
}

.form-input,
.form-select {
    font-family: var(--font-body);
    font-size: var(--fs-body);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--crt-green);
    background: var(--crt-black);
    color: var(--crt-green);
    transition: all 0.2s ease;
}

.form-input::placeholder {
    color: var(--crt-dim-green);
}

.form-input:focus,
.form-select:focus {
    outline: none;
    border-color: var(--crt-amber);
    box-shadow: 0 0 6px rgba(255, 170, 0, 0.3);
    color: var(--crt-amber);
}

.form-input:focus::placeholder {
    color: var(--crt-orange);
}

.form-hint {
    font-size: var(--fs-small);
    color: var(--crt-white);
    opacity: 0.7;
    margin-top: -var(--space-sm);
}

.form-checkbox {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    cursor: pointer;
    user-select: none;
}

.form-checkbox input[type="checkbox"] {
    appearance: none;
    width: 1.2em;
    height: 1.2em;
    border: 1px solid var(--crt-green);
    background: var(--crt-black);
    cursor: pointer;
    position: relative;
}

.form-checkbox input[type="checkbox"]:checked::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--crt-green);
    font-weight: bold;
}

.form-checkbox input[type="checkbox"]:focus {
    outline: none;
    box-shadow: 0 0 6px rgba(0, 255, 0, 0.3);
}

.form-checkbox span {
    color: var(--crt-green);
    font-family: var(--font-body);
}
```

#### 3. Table Component

```html
<div class="table-container">
    <table class="data-table">
        <thead>
            <tr>
                <th>PERSON ID</th>
                <th>NAME</th>
                <th>BIRTH</th>
                <th>STATUS</th>
                <th>ACTION</th>
            </tr>
        </thead>
        <tbody>
            <tr class="row-active">
                <td>PERS-1920-0001</td>
                <td>Pietro Giardina</td>
                <td>1500-??-??</td>
                <td><span class="status-active">ACTIVE</span></td>
                <td><button class="btn-icon">EDIT</button></td>
            </tr>
            <tr>
                <td>PERS-1950-0002</td>
                <td>Maria Giardina</td>
                <td>1950-03-15</td>
                <td><span class="status-active">ACTIVE</span></td>
                <td><button class="btn-icon">EDIT</button></td>
            </tr>
        </tbody>
    </table>
</div>
```

```css
.table-container {
    overflow-x: auto;
    border: 1px solid var(--crt-green);
    background: var(--crt-dark-green);
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-body);
    font-size: var(--fs-small);
}

.data-table thead {
    background: rgba(0, 255, 0, 0.1);
    border-bottom: 2px solid var(--crt-green);
}

.data-table th {
    padding: var(--space-md);
    text-align: left;
    color: var(--crt-green);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-right: 1px solid var(--crt-green);
}

.data-table th:last-child {
    border-right: none;
}

.data-table td {
    padding: var(--space-md);
    color: var(--crt-white);
    border-right: 1px solid rgba(0, 255, 0, 0.2);
    border-bottom: 1px solid rgba(0, 255, 0, 0.1);
}

.data-table td:last-child {
    border-right: none;
}

.data-table tbody tr {
    transition: all 0.15s ease;
}

.data-table tbody tr:hover {
    background: rgba(0, 255, 0, 0.05);
}

.data-table tbody tr.row-active {
    background: rgba(255, 170, 0, 0.05);
    border-left: 3px solid var(--crt-amber);
}

.status-active {
    color: var(--crt-green);
    font-weight: 700;
}

.status-inactive {
    color: var(--crt-dim-green);
}

.status-warning {
    color: var(--crt-amber);
}

.status-error {
    color: var(--crt-red);
}
```

#### 4. Panel/Card Component

```html
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title">GENEALOGY DATA</h3>
        <span class="panel-status">READY</span>
    </div>
    <div class="panel-content">
        <p>Total records: <strong>1,247</strong></p>
        <p>Last sync: <time>2024-03-15 08:00:00</time></p>
    </div>
    <div class="panel-footer">
        <button class="btn btn-primary">REFRESH</button>
    </div>
</div>
```

```css
.panel {
    border: 1px solid var(--crt-green);
    background: rgba(0, 51, 0, 0.3);
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease;
}

.panel:hover {
    border-color: var(--crt-amber);
    background: rgba(0, 51, 0, 0.6);
}

.panel-header {
    padding: var(--space-md);
    border-bottom: 1px solid var(--crt-green);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.panel-title {
    font-family: var(--font-display);
    font-size: var(--fs-h3);
    color: var(--crt-green);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.panel-status {
    font-size: var(--fs-small);
    color: var(--crt-green);
    font-weight: 700;
    text-transform: uppercase;
}

.panel-content {
    padding: var(--space-md);
    flex: 1;
    color: var(--crt-white);
    font-family: var(--font-body);
    line-height: var(--lh-relaxed);
}

.panel-content strong {
    color: var(--crt-amber);
    font-weight: 700;
}

.panel-footer {
    padding: var(--space-md);
    border-top: 1px solid var(--crt-green);
    display: flex;
    gap: var(--space-md);
    justify-content: flex-end;
}
```

#### 5. Navigation Component

```html
<nav class="main-nav">
    <div class="nav-logo">
        <span class="nav-logo-text">GENEALOGIA</span>
        <span class="nav-logo-version">v2.0</span>
    </div>
    <ul class="nav-menu">
        <li><a href="#dashboard" class="nav-link active">DASHBOARD</a></li>
        <li><a href="#data-entry" class="nav-link">DATA ENTRY</a></li>
        <li><a href="#batch" class="nav-link">BATCH JOBS</a></li>
        <li><a href="#reports" class="nav-link">REPORTS</a></li>
        <li><a href="#search" class="nav-link">SEARCH</a></li>
        <li><a href="#admin" class="nav-link">ADMIN</a></li>
        <li><a href="#monitoring" class="nav-link">MONITOR</a></li>
    </ul>
    <div class="nav-status">
        <span class="status-indicator" title="System status">●</span>
        <span class="env-badge">PROD</span>
    </div>
</nav>
```

```css
.main-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md) var(--space-lg);
    background: var(--crt-black);
    border-bottom: 2px solid var(--crt-green);
    gap: var(--space-xl);
}

.nav-logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.nav-logo-text {
    font-family: var(--font-display);
    font-size: var(--fs-h2);
    color: var(--crt-green);
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
}

.nav-logo-version {
    font-family: var(--font-body);
    font-size: var(--fs-small);
    color: var(--crt-white);
    opacity: 0.6;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: var(--space-lg);
    margin: 0;
    padding: 0;
    flex: 1;
}

.nav-link {
    font-family: var(--font-display);
    font-size: var(--fs-small);
    color: var(--crt-white);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid transparent;
    transition: all 0.15s ease;
    cursor: pointer;
}

.nav-link:hover {
    color: var(--crt-green);
    border-bottom: 1px solid var(--crt-green);
}

.nav-link.active {
    color: var(--crt-green);
    border: 1px solid var(--crt-green);
    background: rgba(0, 255, 0, 0.05);
}

.nav-status {
    display: flex;
    align-items: center;
    gap: var(--space-md);
}

.status-indicator {
    font-size: 1.2em;
    color: var(--crt-green);
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

.env-badge {
    font-family: var(--font-display);
    font-size: var(--fs-small);
    color: var(--crt-black);
    background: var(--crt-amber);
    padding: 2px 8px;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.5px;
}
```

---

## ARCHITETTURA SOFTWARE

### 📁 Struttura Directory (Estensione app/)

```
app/
├── src/
│   ├── pages/
│   │   ├── index.astro              (Landing)
│   │   ├── admin/
│   │   │   ├── dashboard.astro      (Admin Dashboard)
│   │   │   └── index.astro
│   │   ├── gestionale/
│   │   │   ├── index.astro          (Main Gestionale Portal)
│   │   │   ├── dashboard.astro      (KPI Dashboard)
│   │   │   ├── data-entry.astro     (CRUD persone/famiglie)
│   │   │   ├── batch-monitor.astro  (GIARDINA orchestrator)
│   │   │   ├── reports.astro        (Report viewer)
│   │   │   ├── search.astro         (Advanced search)
│   │   │   └── monitoring.astro     (Build logs, data quality)
│   │   └── api/
│   │       └── [...dynamic].ts      (API endpoints)
│   │
│   ├── components/
│   │   ├── Layout.astro             (Main layout con nav)
│   │   ├── GestionalLayout.astro    (Gestionale-specific layout)
│   │   ├── ui/
│   │   │   ├── Button.astro
│   │   │   ├── Input.astro
│   │   │   ├── Table.astro
│   │   │   ├── Panel.astro
│   │   │   ├── Navigation.astro
│   │   │   └── ...
│   │   ├── gestionale/
│   │   │   ├── DashboardKPI.astro
│   │   │   ├── DataEntryForm.astro
│   │   │   ├── BatchMonitor.astro
│   │   │   ├── ReportTable.astro
│   │   │   ├── SearchBar.astro
│   │   │   └── LogViewer.astro
│   │   └── admin/
│   │       ├── EnvironmentToggle.astro
│   │       ├── ConfigPanel.astro
│   │       └── SystemStatus.astro
│   │
│   ├── styles/
│   │   ├── global.css               (CRT theme, variables)
│   │   ├── crt.css                  (CRT-specific effects)
│   │   ├── components.css           (Component styles)
│   │   └── animations.css           (Transitions, keyframes)
│   │
│   ├── js/
│   │   ├── gestionale.js            (Main gestionale logic)
│   │   ├── api.js                   (API client)
│   │   ├── env-manager.js           (Dev/test/staging/prod toggle)
│   │   ├── state.js                 (Client-side state)
│   │   ├── utils.js                 (Helpers, formatters)
│   │   └── cobol-viewer.js          (COBOL source viewer)
│   │
│   └── data/
│       ├── current/                 (Published by 90_publish_to_pwa.sh)
│       │   ├── manifest.json
│       │   ├── persone.json
│       │   ├── famiglie.json
│       │   └── records/
│       ├── test/                    (Test environment data)
│       ├── staging/                 (Staging environment data)
│       └── configs/
│           ├── environments.json    (Dev/test/staging/prod configs)
│           └── api-endpoints.json
│
├── public/
│   ├── data/current/               (Symlink to app/src/data/current/)
│   ├── cobol/                      (COBOL source files for viewer)
│   │   └── GIARDINA/               (Symlink to ../../GIARDINA/03_PROG/)
│   └── logs/                       (Build logs for monitoring)
│
├── astro.config.mjs                (Con output: 'static')
├── package.json
└── tsconfig.json
```

### 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION PIPELINE                       │
└─────────────────────────────────────────────────────────────┘

genealogy/gedcom/merged/*.ged (GEDCOM Sync - daily)
    ↓
GIARDINA/02_DATA/RECORDS/current.ged (Ingested)
    ↓
GIARDINA/03_PROG/batch.py
├── validate:  Check integrity
├── build:     Generate JSON exports
└── ingest:    Create manifest.json
    ↓
GIARDINA/05_OUT/site/
├── manifest.json      (Registry of all records)
├── persone.json       (All persons)
├── famiglie.json      (All families)
└── records/*.json     (Individual records)
    ↓
jobs/90_publish_to_pwa.sh (Connector)
    ↓
app/public/data/current/ (PWA data source)
    ↓
Gestionale UI (React on Astro Islands / Vanilla JS)
    ├── Dashboard: KPI from manifest.json
    ├── Data Entry: Read/write to personae.json
    ├── Search: Full-text on records
    └── Reports: Aggregations from families.json
    ↓
GitHub Pages Deploy (Static PWA)

┌─────────────────────────────────────────────────────────────┐
│              ENVIRONMENT SEPARATION                          │
└─────────────────────────────────────────────────────────────┘

Environment Config: app/src/data/configs/environments.json

DEV (localhost:3000)
  ├── API: http://localhost:8080/api
  ├── Data: app/src/data/test/
  └── COBOL Viewer: Local GIARDINA/

TEST (test.genealogia.local)
  ├── API: https://test-api.genealogia.local/api
  ├── Data: Separate test DB
  └── Auth: Test credentials

STAGING (staging.genealogia.local)
  ├── API: https://staging-api.genealogia.local/api
  ├── Data: Staging DB (clone of prod)
  └── Auth: Staging credentials

PROD (genealogia.genealogia.local)
  ├── API: https://api.genealogia.local/api
  ├── Data: Production genealogy data
  └── Auth: Production credentials
```

### 💾 Data Models

#### Person Record Model

```json
{
  "id": "PERS-1920-0001",
  "surname": "Giardina",
  "given_names": "Pietro",
  "birth": {
    "date": "1500-??-??",
    "place": "Sicilia"
  },
  "death": {
    "date": "1560-??-??",
    "place": "Sicilia"
  },
  "notes": [
    "Fondatore della linea Giardina",
    "Correlato a famiglie nobili siciliane"
  ],
  "sources": ["ancestry.com", "familysearch.org"],
  "relationships": {
    "parents": [],
    "spouse": ["PERS-1920-0002"],
    "children": ["PERS-1920-0003", "PERS-1920-0004"]
  },
  "metadata": {
    "created": "2024-03-15T08:00:00Z",
    "modified": "2024-03-15T10:30:00Z",
    "created_by": "gedcom_sync",
    "source_system": "ancestry"
  }
}
```

#### Family Record Model

```json
{
  "id": "FAM-1920-0001",
  "husband": "PERS-1920-0001",
  "wife": "PERS-1920-0002",
  "marriage": {
    "date": "1520-??-??",
    "place": "Sicilia"
  },
  "children": [
    "PERS-1920-0003",
    "PERS-1920-0004",
    "PERS-1920-0005"
  ],
  "metadata": {
    "created": "2024-03-15T08:00:00Z",
    "modified": "2024-03-15T10:30:00Z",
    "source_system": "gedcom_merge"
  }
}
```

#### Manifest/Registry Model

```json
{
  "version": "2.0",
  "generated": "2024-03-15T08:00:00Z",
  "source": "GIARDINA batch.py",
  "statistics": {
    "total_persons": 1247,
    "total_families": 432,
    "total_sources": 89,
    "generations_covered": 14,
    "earliest_birth": "1500-??-??",
    "latest_birth": "2020-03-15"
  },
  "data_files": {
    "persone": "persone.json",
    "famiglie": "famiglie.json",
    "records": "records/"
  },
  "quality_metrics": {
    "completeness": 87.5,
    "accuracy": 92.3,
    "coverage": "Giardina line, Sicilia (1500-2024)"
  }
}
```

### 🔐 Environment Configuration

```javascript
// app/src/js/env-manager.js

class EnvironmentManager {
    constructor() {
        this.environments = {
            dev: {
                name: 'Development',
                apiUrl: 'http://localhost:8080/api',
                dataPath: '/data/test',
                auth: null,
                color: '#FF6600'
            },
            test: {
                name: 'Test',
                apiUrl: 'https://test-api.genealogia.local/api',
                dataPath: '/data/test',
                auth: { user: 'test_user', pass: 'test_pass' },
                color: '#FFAA00'
            },
            staging: {
                name: 'Staging',
                apiUrl: 'https://staging-api.genealogia.local/api',
                dataPath: '/data/staging',
                auth: { token: 'staging_token' },
                color: '#00FFAA'
            },
            prod: {
                name: 'Production',
                apiUrl: 'https://api.genealogia.local/api',
                dataPath: '/data/current',
                auth: { token: 'prod_token' },
                color: '#00FF00'
            }
        };

        this.currentEnv = this._loadEnv();
    }

    _loadEnv() {
        // Leggi da localStorage o query param
        const stored = localStorage.getItem('GENEALOGIA_ENV');
        const param = new URLSearchParams(window.location.search).get('env');
        return param || stored || 'prod';
    }

    switchEnv(envName) {
        if (!this.environments[envName]) throw new Error('Invalid environment');
        this.currentEnv = envName;
        localStorage.setItem('GENEALOGIA_ENV', envName);
        window.location.reload(); // Reload con nuovo env
    }

    getConfig() {
        return this.environments[this.currentEnv];
    }

    getApiUrl(endpoint) {
        return `${this.getConfig().apiUrl}${endpoint}`;
    }

    getDataUrl(file) {
        return `${this.getConfig().dataPath}/${file}`;
    }
}

// Export singleton
export const envManager = new EnvironmentManager();
```

---

## FEATURE SPECIFICATION

### 1. DASHBOARD (KPI & Statistiche)

**Percorso**: `/gestionale/dashboard`

**Funzionalità**:
- 📊 Total records (persone + famiglie)
- 📈 Growth over time
- 🔄 Last sync timestamp
- ✅ Data quality metrics
- 🎯 Coverage (generations spanned)
- ⚠️ Alerts (missing data, inconsistencies)

**Layout**:
```
┌─────────────────────────────────────────────┐
│  GENEALOGIA DASHBOARD                       │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ TOTAL        │  │ LAST SYNC    │        │
│  │ RECORDS      │  │ 2024-03-15   │        │
│  │ 1,247        │  │ 08:00:00     │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ QUALITY      │  │ COVERAGE     │        │
│  │ 92.3%        │  │ 14 gen       │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
│  Recent Changes:                            │
│  • 23 new records (last 7 days)            │
│  • 5 updates (last 24 hours)               │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. DATA ENTRY (CRUD Persone/Famiglie)

**Percorso**: `/gestionale/data-entry`

**Funzionalità**:
- ➕ Create new person/family
- ✏️ Edit existing records
- 🔍 Quick lookup by name/ID
- 🗑️ Delete (with confirmation)
- 📎 Link relationships
- 💾 Save to local storage (offline mode)
- 🔄 Sync when online

**Form Layout**:
```
┌──────────────────────────────────────────┐
│  DATA ENTRY - PERSON RECORD              │
├──────────────────────────────────────────┤
│                                          │
│  RECORD ID: [PERS-1920-0001]            │
│  GIVEN NAMES: [_________________]       │
│  SURNAME: [_________________]            │
│                                          │
│  BIRTH DATE: [1500-??-??]               │
│  BIRTH PLACE: [_________________]       │
│                                          │
│  DEATH DATE: [1560-??-??]               │
│  DEATH PLACE: [_________________]       │
│                                          │
│  SOURCES: [Ancestry.com] [FamilySearch] │
│                                          │
│  [ SAVE ]  [ CLEAR ]  [ DELETE ]        │
│                                          │
└──────────────────────────────────────────┘
```

### 3. BATCH JOB ORCHESTRATOR

**Percorso**: `/gestionale/batch-monitor`

**Funzionalità**:
- 📅 Schedule GIARDINA batch runs
- 📊 Monitor active/completed jobs
- 📜 View batch logs (real-time)
- ⏱️ View execution time
- 🔍 Inspect batch results
- 🔄 Retry failed jobs

**Interface**:
```
┌──────────────────────────────────────────────┐
│  BATCH JOB ORCHESTRATOR                      │
├──────────────────────────────────────────────┤
│                                              │
│  Scheduled Runs:                             │
│  ┌──────────────────────────────────────┐   │
│  │ RUN_ID      STATUS   DURATION   TIME │   │
│  │ RUN_20240315_08:00  COMPLETED  45s  │   │
│  │ RUN_20240314_08:00  COMPLETED  42s  │   │
│  │ RUN_20240313_08:00  COMPLETED  48s  │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [ TRIGGER NEW RUN ]  [ VIEW LOG ]          │
│                                              │
│  Latest Log:                                 │
│  > 08:00:15 [VALIDATE] Checking integrity  │
│  > 08:00:20 [VALIDATE] ✓ PASS              │
│  > 08:00:21 [BUILD] Parsing GEDCOM         │
│  > 08:00:35 [BUILD] ✓ 1,247 records        │
│  > 08:00:36 [INGEST] Writing output...     │
│  > 08:00:45 [INGEST] ✓ Complete            │
│                                              │
└──────────────────────────────────────────────┘
```

### 4. REPORT VIEWER

**Percorso**: `/gestionale/reports`

**Funzionalità**:
- 📋 Pre-built reports (surnames, timelines, locations)
- 🔎 Filter by criteria
- 📊 Export as CSV/JSON
- 🖨️ Print-friendly view
- 📈 Genealogy tree visualization

**Report Types**:
- Persons by surname
- Birth/death timelines
- Geographic distribution
- Family tree (ASCII art)
- Completeness by generation

### 5. ADVANCED SEARCH & FILTER

**Percorso**: `/gestionale/search`

**Funzionalità**:
- 🔍 Full-text search
- 🎯 Advanced filters (date range, location, etc)
- 💾 Save search queries
- ⚡ Real-time results
- 🔗 View related persons/families

### 6. ADMIN/CONFIG

**Percorso**: `/gestionale/admin`

**Funzionalità**:
- 🔧 Configure GEDCOM sync schedule
- 🌍 Environment toggle (dev/test/staging/prod)
- 📝 System settings
- 🔐 User access control (future)
- 📊 API key management (future)

### 7. MONITORING & LOGS

**Percorso**: `/gestionale/monitoring`

**Funzionalità**:
- 📊 System health status
- 📈 Build logs & metrics
- 🔍 Data quality checks
- ⚠️ Error/warning alerts
- 💾 Disk usage, data size
- 🔄 Sync status & history

---

## TECHNICAL ARCHITECTURE

### 🏗️ Component Architecture

```javascript
// app/src/js/gestionale.js
// Main application controller

class Gestionale {
    constructor() {
        this.env = envManager;
        this.api = new GestionalAPI(this.env);
        this.state = new GestionalState();
        this.ui = new GestionalUI();
        
        this.init();
    }

    async init() {
        console.log(`[GESTIONALE] Initializing in ${this.env.currentEnv} environment...`);
        
        // Load manifest
        await this.loadManifest();
        
        // Initialize UI
        this.ui.render(this.state);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup periodic sync
        this.startPeriodicSync();
    }

    async loadManifest() {
        const url = this.env.getDataUrl('manifest.json');
        const response = await fetch(url);
        const manifest = await response.json();
        
        this.state.setManifest(manifest);
        console.log(`[MANIFEST] Loaded: ${manifest.statistics.total_persons} persone, ${manifest.statistics.total_families} famiglie`);
    }

    async loadPersone() {
        const url = this.env.getDataUrl('persone.json');
        const response = await fetch(url);
        const persone = await response.json();
        
        this.state.setPersone(persone);
    }

    async savePerson(personData) {
        // Save to API
        const result = await this.api.createOrUpdatePerson(personData);
        
        // Update local state
        this.state.addOrUpdatePerson(result);
        
        // Refresh UI
        this.ui.showNotification('Person saved successfully', 'success');
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                const action = e.target.dataset.action;
                this[action]?.(e);
            }
        });
    }

    startPeriodicSync() {
        // Sync data every 5 minutes
        setInterval(() => this.loadManifest(), 5 * 60 * 1000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.gestionale = new Gestionale();
});
```

```javascript
// app/src/js/api.js
// API Client

class GestionalAPI {
    constructor(envManager) {
        this.env = envManager;
        this.baseUrl = this.env.getConfig().apiUrl;
    }

    async request(method, endpoint, data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Environment': this.env.currentEnv,
                ...this._getAuthHeaders()
            }
        };

        if (data) options.body = JSON.stringify(data);

        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    _getAuthHeaders() {
        const config = this.env.getConfig();
        if (config.auth?.token) {
            return { 'Authorization': `Bearer ${config.auth.token}` };
        }
        return {};
    }

    // Persons
    async getPersone() {
        return this.request('GET', '/persons');
    }

    async getPerson(id) {
        return this.request('GET', `/persons/${id}`);
    }

    async createOrUpdatePerson(data) {
        const method = data.id ? 'PATCH' : 'POST';
        const endpoint = data.id ? `/persons/${data.id}` : '/persons';
        return this.request(method, endpoint, data);
    }

    async deletePerson(id) {
        return this.request('DELETE', `/persons/${id}`);
    }

    // Families
    async getFamiglie() {
        return this.request('GET', '/families');
    }

    async createOrUpdateFamily(data) {
        const method = data.id ? 'PATCH' : 'POST';
        const endpoint = data.id ? `/families/${data.id}` : '/families';
        return this.request(method, endpoint, data);
    }

    // Batch jobs
    async getJobHistory() {
        return this.request('GET', '/batch/history');
    }

    async triggerBatch(params = {}) {
        return this.request('POST', '/batch/run', params);
    }

    async getJobLog(jobId) {
        return this.request('GET', `/batch/${jobId}/log`);
    }

    // Search
    async search(query, filters = {}) {
        const params = new URLSearchParams({
            q: query,
            ...filters
        });
        return this.request('GET', `/search?${params}`);
    }
}
```

```javascript
// app/src/js/state.js
// Client-side state management

class GestionalState {
    constructor() {
        this.manifest = null;
        this.persone = [];
        this.famiglie = [];
        this.searchResults = [];
        this.currentPerson = null;
        this.filters = {};
        this.observers = [];
    }

    setManifest(manifest) {
        this.manifest = manifest;
        this.notify('manifest');
    }

    setPersone(persone) {
        this.persone = persone;
        this.notify('persone');
    }

    addOrUpdatePerson(person) {
        const idx = this.persone.findIndex(p => p.id === person.id);
        if (idx >= 0) {
            this.persone[idx] = person;
        } else {
            this.persone.push(person);
        }
        this.notify('persone');
    }

    setSearchResults(results) {
        this.searchResults = results;
        this.notify('searchResults');
    }

    setFilters(filters) {
        this.filters = filters;
        this.notify('filters');
    }

    // Observer pattern
    subscribe(callback) {
        this.observers.push(callback);
    }

    notify(key) {
        this.observers.forEach(cb => cb(key, this));
    }
}
```

### 🎨 UI Rendering Layer

```javascript
// app/src/js/ui.js
// UI rendering and interaction

class GestionalUI {
    constructor() {
        this.activeSection = 'dashboard';
        this.templates = new Map();
    }

    render(state) {
        this.state = state;
        this.renderNavigation();
        this.renderCurrentSection();
    }

    renderNavigation() {
        const nav = document.querySelector('.main-nav');
        const envBadge = nav.querySelector('.env-badge');
        const statusIndicator = nav.querySelector('.status-indicator');
        
        envBadge.textContent = this.state.currentEnv.toUpperCase();
        envBadge.style.backgroundColor = envManager.environments[this.state.currentEnv].color;
    }

    renderCurrentSection() {
        const main = document.querySelector('[data-section]');
        
        switch (this.activeSection) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'data-entry':
                this.renderDataEntry();
                break;
            case 'batch':
                this.renderBatchMonitor();
                break;
            // ... other sections
        }
    }

    renderDashboard() {
        const stats = this.state.manifest?.statistics || {};
        const html = `
            <div class="dashboard-container">
                <h1>GENEALOGIA DASHBOARD</h1>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">TOTAL RECORDS</div>
                        <div class="stat-value">${stats.total_persons || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">FAMILIES</div>
                        <div class="stat-value">${stats.total_families || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">QUALITY</div>
                        <div class="stat-value">${stats.quality_metrics?.accuracy || 0}%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">COVERAGE</div>
                        <div class="stat-value">${stats.generations_covered || 0} gen</div>
                    </div>
                </div>
            </div>
        `;
        
        document.querySelector('[data-section]').innerHTML = html;
    }

    renderDataEntry() {
        const html = `
            <div class="data-entry-container">
                <h1>DATA ENTRY</h1>
                <form class="person-form">
                    <div class="form-group">
                        <label class="form-label">RECORD ID:</label>
                        <input type="text" class="form-input" id="record-id" disabled />
                    </div>
                    <div class="form-group">
                        <label class="form-label">GIVEN NAMES:</label>
                        <input type="text" class="form-input" id="given-names" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">SURNAME:</label>
                        <input type="text" class="form-input" id="surname" />
                    </div>
                    <!-- More fields... -->
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">SAVE</button>
                        <button type="reset" class="btn btn-secondary">CLEAR</button>
                    </div>
                </form>
            </div>
        `;
        
        document.querySelector('[data-section]').innerHTML = html;
    }

    renderBatchMonitor() {
        // Real-time batch job monitoring
        // Updates via WebSocket or polling
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
}
```

---

## IMPLEMENTATION ROADMAP

### 📅 Fase 1: Foundation (Week 1-2)

**Obiettivo**: Setup base, design system, navigation

- [ ] Setup Astro PWA estensione in app/
- [ ] Create design system CSS (global.css, crt.css)
- [ ] Implement component library (button, input, table, panel, nav)
- [ ] Create main layout with CRT styling
- [ ] Setup environment manager (dev/test/staging/prod)
- [ ] Create gestionale folder structure

**Output**: Gestionale shell with working navigation, no data yet

### 📅 Fase 2: Data Layer (Week 3-4)

**Obiettivo**: Data loading, API integration, state management

- [ ] Implement GestionalAPI class
- [ ] Implement GestionalState class
- [ ] Load manifest.json from app/public/data/current/
- [ ] Load persone.json & famiglie.json
- [ ] Create data models/schemas
- [ ] Setup offline mode (localStorage)

**Output**: Data flows from GIARDINA to UI

### 📅 Fase 3: Dashboard (Week 5)

**Obiettivo**: First functional feature - KPI Dashboard

- [ ] Render manifest statistics
- [ ] Show quality metrics
- [ ] Display last sync timestamp
- [ ] Create stat cards with CRT styling
- [ ] Add alerts for data issues

**Output**: Working dashboard page

### 📅 Fase 4: Data Entry (Week 6-7)

**Obiettivo**: CRUD operations for persons/families

- [ ] Create data entry form
- [ ] Implement save/update logic
- [ ] Add validation
- [ ] Create delete confirmation
- [ ] Implement relationship linking

**Output**: Full CRUD functionality

### 📅 Fase 5: Batch Monitor (Week 8)

**Obiettivo**: GIARDINA job orchestration visibility

- [ ] Display batch job history
- [ ] Real-time log viewer
- [ ] Trigger new runs
- [ ] Show execution metrics

**Output**: Batch monitoring & orchestration

### 📅 Fase 6: Search & Reports (Week 9-10)

**Obiettivo**: Advanced search and report generation

- [ ] Full-text search implementation
- [ ] Advanced filters
- [ ] Report builder
- [ ] Export functionality

**Output**: Complete search & analytics

### 📅 Fase 7: Admin & Monitoring (Week 11)

**Obiettivo**: Configuration and system health

- [ ] Admin panel
- [ ] System status
- [ ] Build logs viewer
- [ ] Data quality checks

**Output**: Admin & monitoring features

### 📅 Fase 8: Optimization & Polish (Week 12)

**Obiettivo**: Performance, UX refinement, documentation

- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] UX polish
- [ ] Complete documentation

**Output**: Production-ready gestionale

---

## DOCUMENTAZIONE DETTAGLIATA

### 📚 Documentation Suite

#### 1. Component Library Documentation

**File**: `docs/COMPONENT_LIBRARY.md`

For each component:
- Purpose & use cases
- HTML structure
- CSS classes & variables
- JavaScript API (if applicable)
- Accessibility features
- Examples & variations

#### 2. User Manual

**File**: `docs/USER_MANUAL.md`

- Getting started
- Each feature walkthrough
- Keyboard shortcuts
- Troubleshooting
- FAQ

#### 3. Technical Architecture Document

**File**: `docs/TECHNICAL_ARCHITECTURE.md`

- Data flow diagrams
- Component hierarchy
- State management patterns
- API specification
- Database schema (if applicable)

#### 4. COBOL Integration Guide

**File**: `docs/COBOL_INTEGRATION.md`

- How to view COBOL source code
- Understanding batch.py logic
- Extending with new fields
- Debugging data issues

#### 5. Environment Configuration Guide

**File**: `docs/ENVIRONMENTS.md`

- Setup dev environment
- Testing on test/staging
- Production deployment
- Environment-specific settings

---

## COWORK EXECUTION PLAN

### 🎯 Prompt Sequencing

I'll create a comprehensive Cowork prompt that breaks down into:

1. **Phase 1**: Design System Setup
2. **Phase 2**: Component Library Creation
3. **Phase 3**: Gestionale Pages & Layout
4. **Phase 4**: Data Integration
5. **Phase 5**: Feature Implementation
6. **Phase 6**: Documentation
7. **Phase 7**: Testing & Deployment

Each phase with specific, testable deliverables.

---

## NEXT STEPS

1. ✅ **Approval**: Review this masterplan
2. ✅ **Refinement**: Any changes/adjustments?
3. ✅ **Execution**: Create detailed Cowork prompts for each phase
4. ✅ **Implementation**: Execute with Codex/Cowork in phases

---

**MASTERPLAN COMPLETE**

This document provides the complete vision for a 370-style gestionale integrated into your Astro PWA, with three environment separation and elegant CRT aesthetics. Ready to move to detailed implementation prompts!

🚀
