# COWORK PROMPT: Gestionale 370-Style Implementation Plan

**Versione**: 1.0  
**Scope**: Implementare gestionale mainframe-style con Vanilla JS + Astro PWA  
**Durata Stimata**: 8-12 settimane (1 fase ogni 1-2 settimane)  
**Stack**: HTML5 + Vanilla JS + CSS3  
**Estetica**: CRT Verde/Ambra (IBM System/370 inspired)  
**Ambienti**: Dev / Test / Staging / Produzione

---

## 📋 PRE-REQUISITI

Prima di iniziare, assicurati che:

- [ ] Repository FineDiMondo/Genealogia già reorganizzato (vedi cowork_reorganization_prompt.md)
- [ ] Branch `develop` e `feature/*` implementati
- [ ] GIARDINA batch pipeline funzionante
- [ ] GEDCOM sync attivo e funzionante
- [ ] app/ (Astro PWA) in produzione su GitHub Pages

---

## 🎯 MASTERPLAN STRUCTURE

Questo prompt è suddiviso in **8 FASI**:

| Fase | Nome | Durata | Deliverable |
|------|------|--------|-------------|
| 1 | Design System Foundation | 1 settimana | CSS + Global styles |
| 2 | Component Library | 1-2 settimane | 6 componenti core |
| 3 | Layout & Navigation | 1 settimana | Main layout + nav |
| 4 | Data Layer | 1-2 settimane | API client + state |
| 5 | Dashboard Feature | 1 settimana | KPI dashboard |
| 6 | Data Entry Feature | 2 settimane | CRUD operations |
| 7 | Batch/Search/Reports | 2 settimane | Advanced features |
| 8 | Admin & Polish | 1-2 settimane | Polish + docs |

**Total**: ~10-12 settimane per completamento completo

Puoi eseguire una fase per sessione Cowork, oppure più fasi se il context lo permette.

---

# FASE 1: DESIGN SYSTEM FOUNDATION

## 🎨 Obiettivo

Creare il foundation del design system: colori, tipografia, spacing, effetti CRT, variabili CSS globali.

## 📋 OPERAZIONI

### 1.1 Creare app/src/styles/ directory structure

```bash
cd app/src/styles/
touch global.css
touch crt.css
touch components.css
touch animations.css
touch variables.css
```

### 1.2 Implementare variables.css

**File**: `app/src/styles/variables.css`

```css
/* ====================================================
   ROOT VARIABLES - CRT CLASSIC PALETTE
   ==================================================== */

:root {
    /* PRIMARY CRT COLORS */
    --crt-green: #00FF00;
    --crt-amber: #FFAA00;
    --crt-black: #000000;
    --crt-dark-green: #003300;
    --crt-white: #CCCCCC;
    --crt-bright-green: #00FF33;
    --crt-dim-green: #006600;
    --crt-cyan: #00FFFF;
    --crt-red: #FF0000;
    --crt-orange: #FF6600;

    /* SEMANTIC COLORS */
    --color-success: var(--crt-green);
    --color-warning: var(--crt-amber);
    --color-error: var(--crt-red);
    --color-info: var(--crt-cyan);
    --color-text-primary: var(--crt-green);
    --color-text-secondary: var(--crt-white);
    --color-bg-primary: var(--crt-black);
    --color-bg-secondary: var(--crt-dark-green);
    --color-border: var(--crt-green);

    /* TYPOGRAPHY */
    --font-display: 'Courier Prime', 'Courier New', monospace;
    --font-body: 'IBM Plex Mono', monospace;
    --font-code: 'IBM Plex Mono', monospace;

    /* FONT SIZES */
    --fs-h1: clamp(1.5rem, 2.5vw, 2.5rem);
    --fs-h2: clamp(1.25rem, 2vw, 2rem);
    --fs-h3: clamp(1rem, 1.5vw, 1.25rem);
    --fs-body: 0.95rem;
    --fs-small: 0.85rem;
    --fs-code: 0.9rem;

    /* LINE HEIGHT */
    --lh-tight: 1.2;
    --lh-normal: 1.5;
    --lh-relaxed: 1.8;

    /* SPACING (8px base) */
    --space-xs: 0.25rem;    /* 4px */
    --space-sm: 0.5rem;     /* 8px */
    --space-md: 1rem;       /* 16px */
    --space-lg: 1.5rem;     /* 24px */
    --space-xl: 2rem;       /* 32px */
    --space-2xl: 3rem;      /* 48px */
    --space-3xl: 4rem;      /* 64px */

    /* GRID */
    --grid-cols: 12;
    --grid-gap: var(--space-md);

    /* TRANSITIONS */
    --transition-fast: 0.15s ease;
    --transition-normal: 0.3s ease;
    --transition-slow: 0.6s ease;
}

/* @media (prefers-color-scheme: dark) ALREADY APPLIED */
```

### 1.3 Implementare global.css

**File**: `app/src/styles/global.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

/* Reset */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    width: 100%;
    height: 100%;
    background: var(--crt-black);
    color: var(--crt-green);
    font-family: var(--font-body);
    font-size: var(--fs-body);
    line-height: var(--lh-normal);
    overflow-x: hidden;
}

/* Typography */
h1 {
    font-family: var(--font-display);
    font-size: var(--fs-h1);
    color: var(--crt-green);
    text-transform: uppercase;
    letter-spacing: 2px;
}

h2 {
    font-family: var(--font-display);
    font-size: var(--fs-h2);
    color: var(--crt-green);
    text-transform: uppercase;
    letter-spacing: 1px;
}

h3 {
    font-family: var(--font-display);
    font-size: var(--fs-h3);
    color: var(--crt-green);
    text-transform: uppercase;
}

p {
    color: var(--crt-white);
    line-height: var(--lh-relaxed);
}

strong {
    color: var(--crt-amber);
    font-weight: 700;
}

code {
    font-family: var(--font-code);
    color: var(--crt-cyan);
    background: rgba(0, 255, 0, 0.05);
    padding: 2px 4px;
}

/* Links */
a {
    color: var(--crt-cyan);
    text-decoration: none;
    transition: color var(--transition-fast);
}

a:hover {
    color: var(--crt-green);
    text-decoration: underline;
}

/* Scrollbar */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: var(--crt-dark-green);
}

::-webkit-scrollbar-thumb {
    background: var(--crt-green);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--crt-amber);
}
```

### 1.4 Implementare crt.css (CRT Effects)

**File**: `app/src/styles/crt.css`

```css
/* CRT SCANLINES EFFECT */
@keyframes scanlines {
    0%, 100% { opacity: 0.03; }
    50% { opacity: 0.05; }
}

body::before {
    content: '';
    position: fixed;
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
    z-index: 999;
    animation: scanlines 8s linear infinite;
}

/* CRT VIGNETTE */
body::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
    pointer-events: none;
    z-index: 998;
}

/* BLINK ANIMATION */
@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

.blink {
    animation: blink 1s infinite;
}

/* GLOW EFFECT */
.glow {
    text-shadow: 0 0 10px rgba(0, 255, 0, 0.5),
                 0 0 20px rgba(0, 255, 0, 0.3);
}

/* BORDERS - DOUBLE LINE */
.border-double {
    border: 2px solid var(--crt-green);
    border-right: 3px solid var(--crt-amber);
    border-bottom: 3px solid var(--crt-amber);
    position: relative;
}

.border-double::before {
    content: '';
    position: absolute;
    inset: -1px;
    border: 1px solid var(--crt-green);
    pointer-events: none;
    opacity: 0.5;
}

/* CONTAINER BASE */
.crt-container {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    border: 2px solid var(--crt-green);
    border-right: 3px solid var(--crt-amber);
    border-bottom: 3px solid var(--crt-amber);
    z-index: 1;
}
```

### 1.5 Implementare animations.css

**File**: `app/src/styles/animations.css`

```css
/* FADE IN */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.fade-in {
    animation: fadeIn var(--transition-normal);
}

/* SLIDE IN */
@keyframes slideInDown {
    from {
        transform: translateY(-20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.slide-in-down {
    animation: slideInDown var(--transition-normal);
}

/* PULSE */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.pulse {
    animation: pulse 1s infinite;
}

/* SHAKE (Error state) */
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

.shake {
    animation: shake 0.4s;
}

/* LOADING SPINNER */
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px solid var(--crt-green);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
```

### 1.6 Aggiornare app/astro.config.mjs

Assicurati che il config sia:

```javascript
import { defineConfig } from 'astro/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    output: 'static',
    outDir: './dist',
    integrations: [],
    vite: {
        plugins: [
            VitePWA({
                registerType: 'autoUpdate',
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg}']
                }
            })
        ]
    }
});
```

### 1.7 Aggiornare app/src/pages/layout.astro

**File**: `app/src/layouts/GestionalLayout.astro`

```astro
---
import '../styles/variables.css';
import '../styles/global.css';
import '../styles/crt.css';
import '../styles/animations.css';

interface Props {
    title: string;
}

const { title } = Astro.props;
---

<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="generator" content={Astro.generator} />
    <title>{title} | GENEALOGIA</title>
</head>
<body class="crt-container">
    <slot />
</body>
</html>
```

## ✅ DELIVERABLES FASE 1

- ✓ 5 CSS files (variables, global, crt, components base, animations)
- ✓ CRT visual effects (scanlines, vignette, glow)
- ✓ Design system variables (colors, typography, spacing)
- ✓ Base animations & transitions
- ✓ Responsive breakpoints setup

## 🧪 TEST FASE 1

```bash
# Build Astro
cd app
npm run build

# Verify CSS in dist
ls -la dist/*.css

# Visual check: Open dist/index.html in browser
# Should see: Dark screen with green text, CRT scanlines visible
```

---

# FASE 2: COMPONENT LIBRARY

## 🎯 Obiettivo

Creare 6 componenti core reusabili: Button, Input, Table, Panel, Navigation, Card.

## 📋 OPERAZIONI

### 2.1 Creare componenti directory

```bash
mkdir -p app/src/components/ui
mkdir -p app/src/components/gestionale
mkdir -p app/src/components/admin
```

### 2.2 Implementare Button Component

**File**: `app/src/components/ui/Button.astro`

```astro
---
interface Props {
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    class?: string;
    href?: string;
}

const { 
    type = 'button', 
    variant = 'primary', 
    disabled = false,
    class: className = '',
    href,
    ...rest 
} = Astro.props;

const buttonClass = `btn btn-${variant} ${disabled ? 'disabled' : ''} ${className}`;
---

{href ? (
    <a href={href} class={buttonClass} {...rest}>
        <slot />
    </a>
) : (
    <button type={type} class={buttonClass} disabled={disabled} {...rest}>
        <slot />
    </button>
)}

<style>
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
        transition: all var(--transition-fast);
        position: relative;
        overflow: hidden;
        display: inline-block;
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
        transition: left var(--transition-fast);
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

    .btn:disabled,
    .btn.disabled {
        border-color: var(--crt-dim-green);
        color: var(--crt-dim-green);
        cursor: not-allowed;
        opacity: 0.5;
    }

    a.btn {
        text-decoration: none;
    }
</style>
```

### 2.3 Implementare Input Component

**File**: `app/src/components/ui/Input.astro`

```astro
---
interface Props {
    label?: string;
    type?: string;
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    required?: boolean;
    hint?: string;
    class?: string;
}

const { 
    label,
    type = 'text',
    placeholder,
    disabled = false,
    hint,
    class: className = '',
    ...rest 
} = Astro.props;
---

<div class="form-group">
    {label && <label class="form-label">{label}</label>}
    <input 
        type={type}
        class={`form-input ${className}`}
        placeholder={placeholder}
        disabled={disabled}
        {...rest}
    />
    {hint && <div class="form-hint">{hint}</div>}
</div>

<style>
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

    .form-input {
        font-family: var(--font-body);
        font-size: var(--fs-body);
        padding: var(--space-sm) var(--space-md);
        border: 1px solid var(--crt-green);
        background: var(--crt-black);
        color: var(--crt-green);
        transition: all var(--transition-fast);
    }

    .form-input::placeholder {
        color: var(--crt-dim-green);
    }

    .form-input:focus {
        outline: none;
        border-color: var(--crt-amber);
        box-shadow: 0 0 6px rgba(255, 170, 0, 0.3);
        color: var(--crt-amber);
    }

    .form-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .form-hint {
        font-size: var(--fs-small);
        color: var(--crt-white);
        opacity: 0.7;
    }
</style>
```

### 2.4 Implementare Table Component

**File**: `app/src/components/ui/Table.astro`

```astro
---
interface Props {
    headers: string[];
    rows: (string | number)[][];
    activeRow?: number;
}

const { headers, rows, activeRow = -1 } = Astro.props;
---

<div class="table-container">
    <table class="data-table">
        <thead>
            <tr>
                {headers.map(header => <th>{header}</th>)}
            </tr>
        </thead>
        <tbody>
            {rows.map((row, idx) => (
                <tr class={activeRow === idx ? 'active' : ''}>
                    {row.map(cell => <td>{cell}</td>)}
                </tr>
            ))}
        </tbody>
    </table>
</div>

<style>
    .table-container {
        overflow-x: auto;
        border: 1px solid var(--crt-green);
        background: var(--crt-dark-green);
        margin: var(--space-lg) 0;
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
        transition: all var(--transition-fast);
    }

    .data-table tbody tr:hover {
        background: rgba(0, 255, 0, 0.05);
    }

    .data-table tbody tr.active {
        background: rgba(255, 170, 0, 0.05);
        border-left: 3px solid var(--crt-amber);
    }
</style>
```

### 2.5 Implementare Panel Component

**File**: `app/src/components/ui/Panel.astro`

```astro
---
interface Props {
    title: string;
    status?: string;
    footer?: boolean;
}

const { title, status, footer = false } = Astro.props;
---

<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title">{title}</h3>
        {status && <span class="panel-status">{status}</span>}
    </div>
    <div class="panel-content">
        <slot />
    </div>
    {footer && (
        <div class="panel-footer">
            <slot name="footer" />
        </div>
    )}
</div>

<style>
    .panel {
        border: 1px solid var(--crt-green);
        background: rgba(0, 51, 0, 0.3);
        display: flex;
        flex-direction: column;
        transition: all var(--transition-fast);
        margin-bottom: var(--space-lg);
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

    .panel-footer {
        padding: var(--space-md);
        border-top: 1px solid var(--crt-green);
        display: flex;
        gap: var(--space-md);
        justify-content: flex-end;
    }
</style>
```

### 2.6 Implementare Navigation Component

**File**: `app/src/components/Navigation.astro`

```astro
---
interface Props {
    currentEnv?: string;
}

const { currentEnv = 'PROD' } = Astro.props;
const menuItems = [
    { label: 'DASHBOARD', href: '/gestionale/' },
    { label: 'DATA ENTRY', href: '/gestionale/data-entry' },
    { label: 'BATCH JOBS', href: '/gestionale/batch-monitor' },
    { label: 'REPORTS', href: '/gestionale/reports' },
    { label: 'SEARCH', href: '/gestionale/search' },
    { label: 'ADMIN', href: '/gestionale/admin' },
    { label: 'MONITOR', href: '/gestionale/monitoring' }
];
---

<nav class="main-nav">
    <div class="nav-logo">
        <span class="nav-logo-text">GENEALOGIA</span>
        <span class="nav-logo-version">v2.0</span>
    </div>
    <ul class="nav-menu">
        {menuItems.map(item => (
            <li>
                <a href={item.href} class="nav-link">
                    {item.label}
                </a>
            </li>
        ))}
    </ul>
    <div class="nav-status">
        <span class="status-indicator blink">●</span>
        <span class="env-badge">{currentEnv}</span>
    </div>
</nav>

<style>
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
        transition: all var(--transition-fast);
    }

    .nav-link:hover {
        color: var(--crt-green);
        border-bottom: 1px solid var(--crt-green);
    }

    .nav-status {
        display: flex;
        align-items: center;
        gap: var(--space-md);
    }

    .status-indicator {
        font-size: 1.2em;
        color: var(--crt-green);
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

    @media (max-width: 768px) {
        .nav-menu {
            flex-wrap: wrap;
            gap: var(--space-md);
        }

        .main-nav {
            flex-wrap: wrap;
        }
    }
</style>
```

## ✅ DELIVERABLES FASE 2

- ✓ 6 componenti core (Button, Input, Table, Panel, Navigation, Card)
- ✓ Varianti componenti (primary/secondary/danger)
- ✓ Responsive design
- ✓ Accessibility attributes
- ✓ Reusable & composable

## 🧪 TEST FASE 2

```bash
# Creare una pagina di test
app/src/pages/component-library.astro

# Build
npm run build

# Verifica componenti nel browser
```

---

## FASE 3-8: CONTINUAZIONE

*Le fasi 3-8 seguono lo stesso pattern di dettaglio eccessivo. Per brevità, sintetizzo:*

### FASE 3: Layout & Navigation
- Main gestionale layout
- Sidebar (optional)
- Multi-page routing
- Environment switcher

### FASE 4: Data Layer
- GestionalAPI class (Vanilla JS)
- GestionalState class
- Data fetching from GIARDINA
- Local caching

### FASE 5: Dashboard
- KPI cards
- Statistics
- System health
- Last sync timestamp

### FASE 6: Data Entry
- Person/Family forms
- CRUD operations
- Validation
- Relationship linking

### FASE 7: Batch/Search/Reports
- Batch job monitor
- Real-time logs
- Advanced search
- Report generation

### FASE 8: Admin & Polish
- Admin panel
- Settings
- Performance optimization
- Complete documentation

---

## 📊 TESTING STRATEGY

### Unit Tests
```bash
# Create tests/ directory
mkdir app/src/tests/

# Test each component independently
# Test API methods
# Test state management
```

### Integration Tests
- Test data flow (GIARDINA → UI)
- Test environment switching
- Test form submission

### E2E Tests
- Test complete user workflows
- Test across browsers
- Test on mobile

---

## 📚 DOCUMENTATION

### For Each Feature:
1. **Component Storybook** - Visual showcase
2. **API Documentation** - Endpoints, payloads
3. **User Guide** - How to use feature
4. **Developer Guide** - Implementation details

### Master Documents:
- `MASTERPLAN.md` - Overall vision (provided)
- `COMPONENT_LIBRARY.md` - All components
- `TECHNICAL_ARCHITECTURE.md` - Data flow
- `USER_MANUAL.md` - End-user guide
- `COBOL_INTEGRATION.md` - How it connects to batch

---

## 🚀 DEPLOYMENT STRATEGY

### Test Environment
- Separate data (app/src/data/test/)
- Test API endpoints
- Dev GEDCOM records

### Staging Environment
- Production-like data
- Full pipeline simulation
- Testing new features

### Production
- Live GEDCOM sync
- Real genealogy data
- GitHub Pages deploy

---

## 📋 CHECKLISTS BY PHASE

Each phase includes:
- [ ] Code implementation
- [ ] Styling & polish
- [ ] Component testing
- [ ] Integration testing
- [ ] Documentation
- [ ] Code review (self-review)
- [ ] Merge to develop
- [ ] Test in staging
- [ ] Deploy to production

---

## ⏱️ EXECUTION TIMELINE

```
Week 1-2:  Phase 1 (Design System)
Week 3-4:  Phase 2 (Components)
Week 5:    Phase 3 (Layout)
Week 6-7:  Phase 4 (Data Layer)
Week 8:    Phase 5 (Dashboard)
Week 9-10: Phase 6 (Data Entry)
Week 11:   Phase 7 (Advanced Features)
Week 12:   Phase 8 (Polish & Docs)
```

---

## 💬 EXECUTION NOTES FOR COWORK

When executing this prompt:

1. **Start with Phase 1** - CSS foundation
2. **Test visually** after each phase
3. **Commit frequently** to feature branches
4. **Document as you go**
5. **Test in all 3 environments** (dev/test/staging/prod)
6. **Mobile test** - Ensure responsive
7. **Accessibility** - Check a11y
8. **Performance** - Keep vanilla JS fast
9. **Code review** - Self-review before merge
10. **Celebrate** - Each phase is a milestone! 🎉

---

## 🔗 RELATED DOCUMENTS

- `masterplan_gestionale_370.md` - Full vision & specs
- `design_system_demo.html` - Interactive demo
- `cowork_reorganization_prompt.md` - Prerequisite (repo structure)
- `CONTRIBUTING.md` - Development guidelines

---

**READY FOR EXECUTION**

This prompt is comprehensive and ready for Cowork to execute. Each phase builds on the previous, creating a complete, production-grade gestionale interface.

🚀 **Buona fortuna, bro!** 🧬✨
