# 🖥️ GESTIONALE 370-STYLE - PROJECT MASTER GUIDE

**Status**: 🟢 Ready for Implementation  
**Version**: 1.0  
**Date**: 2024-03-15  
**Repository**: https://github.com/FineDiMondo/Genealogia  
**Scope**: Complete mainframe-style gestionale for genealogy data management

---

## 📑 DOCUMENT STRUCTURE

This project contains **4 core documents** that work together:

### 1. 📋 **MASTERPLAN_GESTIONALE_370.md** (48 KB)
**The Bible** - Complete vision, specifications, and architecture

**Contains**:
- ✅ Design philosophy & user personas
- ✅ Complete design system (colors, typography, spacing, effects)
- ✅ Component library specifications (Button, Input, Table, Panel, Navigation)
- ✅ Technical architecture (data flow, API design, state management)
- ✅ Feature specifications (7 major features)
- ✅ Implementation roadmap (8 phases, 12 weeks)
- ✅ Detailed code examples for each component

**When to Read**: 
- First time overview
- Architecture decision-making
- Reference for design system

**Length**: ~1,757 lines / 48 KB

---

### 2. 🎨 **DESIGN_SYSTEM_DEMO.html** (27 KB)
**The Visual Reference** - Interactive, working example of all components

**Contains**:
- ✅ Live, clickable component examples
- ✅ Complete CSS implementation (ready to copy-paste)
- ✅ CRT styling with scanlines, vignette, glow effects
- ✅ Navigation switching between sections
- ✅ All components rendered: buttons, forms, panels, tables, stats
- ✅ Responsive mobile design

**When to Use**:
- Visual reference during development
- Copy CSS directly into your project
- Test styling in real browser
- Show stakeholders the design

**How to Use**:
1. Open `design_system_demo.html` in web browser
2. Click navigation items to see different sections
3. Right-click → Inspect to see CSS
4. Copy styles into your Astro components

---

### 3. 📖 **COWORK_GESTIONALE_IMPLEMENTATION.md** (26 KB)
**The Execution Plan** - Step-by-step implementation with Cowork

**Contains**:
- ✅ Pre-requisites checklist
- ✅ 8 phases with detailed operations
- ✅ Phase 1: Design System Foundation (variables.css, global.css, etc)
- ✅ Phase 2: Component Library (6 core components with full code)
- ✅ Phases 3-8: Implementation roadmap
- ✅ Testing strategy
- ✅ Deployment strategy
- ✅ Timeline & execution notes

**When to Use**:
- Execute with Cowork (copy-paste into Cowork)
- Reference for phase completion
- Checklist for progress tracking

**How to Execute**:
1. Copy entire COWORK_GESTIONALE_IMPLEMENTATION.md
2. Open Cowork in FineDiMondo/Genealogia repo
3. Paste content into Cowork
4. Execute phase by phase (1 phase per session)
5. Mark items as complete

---

### 4. 📚 **THIS FILE** (README_MASTER.md)
**The Navigator** - Guide to using all other documents

---

## 🎯 QUICK START (Choose Your Path)

### Path A: I want to understand the vision first
1. Read **MASTERPLAN** (section by section)
2. Open **DESIGN_SYSTEM_DEMO** in browser
3. Understand the architecture & features

### Path B: I want to implement immediately
1. Open **DESIGN_SYSTEM_DEMO** in browser (visual reference)
2. Copy COWORK_GESTIONALE_IMPLEMENTATION to Cowork
3. Execute Phase 1 (Design System Foundation)
4. Proceed phase by phase

### Path C: I need specific information
- **"How do I style a button?"** → DESIGN_SYSTEM_DEMO (live example)
- **"What's the data flow?"** → MASTERPLAN (Technical Architecture section)
- **"How do I build dashboard?"** → COWORK (Phase 5 section)
- **"What components exist?"** → MASTERPLAN (Feature Specification section)

---

## 📦 PROJECT STRUCTURE (After Implementation)

```
app/
├── src/
│   ├── pages/
│   │   └── gestionale/
│   │       ├── index.astro              (Main portal)
│   │       ├── dashboard.astro          (KPI dashboard)
│   │       ├── data-entry.astro         (CRUD forms)
│   │       ├── batch-monitor.astro      (Batch orchestrator)
│   │       ├── reports.astro            (Reports viewer)
│   │       ├── search.astro             (Search interface)
│   │       └── monitoring.astro         (System health)
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.astro
│   │   │   ├── Input.astro
│   │   │   ├── Table.astro
│   │   │   ├── Panel.astro
│   │   │   └── Navigation.astro
│   │   ├── gestionale/
│   │   │   ├── DashboardKPI.astro
│   │   │   ├── DataEntryForm.astro
│   │   │   └── ...
│   │   └── admin/
│   │       └── ...
│   │
│   ├── styles/
│   │   ├── variables.css       (Design system variables)
│   │   ├── global.css          (Base styles)
│   │   ├── crt.css             (CRT effects)
│   │   ├── components.css      (Component styles)
│   │   └── animations.css      (Transitions)
│   │
│   ├── js/
│   │   ├── gestionale.js       (Main controller)
│   │   ├── api.js              (API client)
│   │   ├── env-manager.js      (Env switching)
│   │   ├── state.js            (State management)
│   │   └── utils.js            (Helpers)
│   │
│   └── data/
│       ├── current/            (Production data from GIARDINA)
│       ├── test/               (Test environment data)
│       └── staging/            (Staging environment data)
│
└── docs/
    ├── COMPONENT_LIBRARY.md    (All components)
    ├── USER_MANUAL.md          (User guide)
    ├── TECHNICAL_ARCHITECTURE.md
    └── COBOL_INTEGRATION.md
```

---

## 🎨 DESIGN HIGHLIGHTS

### CRT Aesthetic
- **Color Palette**: Verde/Ambra su nero (Classic IBM System/370)
- **Typography**: Courier Prime (display) + IBM Plex Mono (body)
- **Effects**: Scanlines, vignette, glow on hover
- **Mainframe Style**: Double borders, monospace, uppercase labels

### Components
- **Button**: Primary/secondary/danger variants with hover glow
- **Input**: Form inputs with focus states and hints
- **Table**: Data grids with pagination & status indicators
- **Panel**: Flexible containers for content & forms
- **Navigation**: Main nav with env badge indicator

### Responsive
- Mobile-first approach
- Adapts to all screen sizes
- Touch-friendly buttons & forms

---

## 🏗️ ARCHITECTURE OVERVIEW

### Data Flow (Unified Pipeline)

```
GEDCOM Sync (daily at 08:00)
    ↓
GIARDINA/02_DATA/RECORDS/current.ged
    ↓
GIARDINA/03_PROG/batch.py (validate → build → ingest)
    ↓
GIARDINA/05_OUT/site/ (manifest + JSON exports)
    ↓
jobs/90_publish_to_pwa.sh
    ↓
app/public/data/current/ (PWA data source)
    ↓
Gestionale UI (Vanilla JS + Astro)
    ├── Dashboard: Read from manifest.json
    ├── Data Entry: Read/write to persone.json
    └── Reports: Aggregations from famiglie.json
```

### Environment Separation

```
DEV (localhost:3000)
  ├── Data: app/src/data/test/
  └── Config: env-manager.js DEV config

TEST (test.genealogia.local)
  ├── Data: Separate test database
  └── Config: TEST environment

STAGING (staging.genealogia.local)
  ├── Data: Clone of production
  └── Config: STAGING environment

PROD (genealogia.genealogia.local)
  ├── Data: Live genealogy records
  └── Config: PROD environment
```

---

## 🎓 LEARNING RESOURCES

### For Designers
- **DESIGN_SYSTEM_DEMO.html** - See all components
- **MASTERPLAN** → Design System section - Understand variables
- **MASTERPLAN** → Visual Effects section - CRT techniques

### For Frontend Developers
- **MASTERPLAN** → Technical Architecture - Component hierarchy
- **COWORK_GESTIONALE_IMPLEMENTATION** → Phase 2 - Component code
- **design_system_demo.html** → Copy CSS directly

### For Backend/Data Developers
- **MASTERPLAN** → Architecture → Data Models - JSON schemas
- **MASTERPLAN** → Architecture → Data Flow - Pipeline integration
- **MASTERPLAN** → Technical Architecture → API Design - Endpoints

### For Project Managers
- **MASTERPLAN** → Implementation Roadmap - Timeline & phases
- **COWORK_GESTIONALE_IMPLEMENTATION** → Execution Notes - Coordination
- **This README** → Quick Start - Status tracking

---

## 🚀 IMPLEMENTATION PHASES

Each phase builds on the previous. Recommended order:

| # | Phase | Duration | Key Deliverable |
|---|-------|----------|-----------------|
| 1 | Design System | 1 week | CSS variables, global styles, effects |
| 2 | Components | 1-2 weeks | 6 reusable UI components |
| 3 | Layout | 1 week | Main layout, navigation, pages |
| 4 | Data Layer | 1-2 weeks | API client, state management |
| 5 | Dashboard | 1 week | First working feature (KPI) |
| 6 | Data Entry | 2 weeks | CRUD operations |
| 7 | Advanced | 2 weeks | Batch monitor, search, reports |
| 8 | Polish | 1-2 weeks | Optimization, documentation |

**Total**: ~10-12 weeks for complete implementation

---

## ✅ PRE-REQUISITES

Before starting gestionale implementation:

- [ ] Repository reorganized (cowork_reorganization_prompt.md completed)
- [ ] `develop` branch created with branch protection
- [ ] GIARDINA batch pipeline working
- [ ] GEDCOM sync operational
- [ ] app/ (Astro PWA) building successfully
- [ ] GitHub Pages deployment working

**If any of these are missing**, execute `cowork_reorganization_prompt.md` first.

---

## 🧪 TESTING STRATEGY

### Visual Testing
- Open `design_system_demo.html` frequently
- Compare live app to demo
- Test all color transitions

### Component Testing
- Each component should work independently
- Test responsive on mobile/tablet/desktop
- Test all variants (primary/secondary/danger)
- Test disabled states

### Integration Testing
- Data flows from GIARDINA to UI
- Environment switching works
- Forms save/load correctly
- Navigation between pages works

### E2E Testing (Future)
- Complete user workflows
- Cross-browser compatibility
- Performance metrics

---

## 📚 DOCUMENTATION STRUCTURE

During implementation, create these documents:

```
docs/
├── COMPONENT_LIBRARY.md        (All components + usage)
├── USER_MANUAL.md              (How to use gestionale)
├── TECHNICAL_ARCHITECTURE.md   (Code structure, API, state)
├── COBOL_INTEGRATION.md        (How COBOL connects)
├── ENVIRONMENTS.md             (Dev/test/staging/prod setup)
└── CONTRIBUTING.md             (Dev guidelines)
```

---

## 🔗 RELATED DOCUMENTATION

### Project Overview
- **cowork_reorganization_prompt.md** - Repository structure & branching
- **GEDCOM_SYNC_README.md** - Sync orchestrator documentation
- **Fine di Mondo Regolamento** - Organization policies

### Technical References
- Astro Documentation: https://astro.build
- MDN Web Docs: https://developer.mozilla.org
- IBM System/370 History (for inspiration)

---

## 💡 DESIGN PRINCIPLES

This gestionale is built on these principles:

1. **Minimalismo Funzionale** - Every pixel has purpose
2. **Trasparenza Logica** - Data flow is visible
3. **Eleganza Formale** - Mainframe style with modern UX
4. **Accessibilità** - CRT styling + screen reader support
5. **Performance** - Vanilla JS, zero bloat
6. **Maintainability** - Clean code, well documented
7. **Scalability** - Prepared for team growth

---

## 🎯 SUCCESS METRICS

After completion, the gestionale should:

- ✅ Load in < 200ms (Vanilla JS is fast!)
- ✅ Work offline with localStorage
- ✅ Support all genealogy CRUD operations
- ✅ Display COBOL/batch pipeline in real-time
- ✅ Be understandable by new contributors
- ✅ Pass accessibility audits
- ✅ Render beautifully on all devices

---

## 🆘 TROUBLESHOOTING

### Q: Where do I start?
**A**: Path B (Quick Start) - Open DESIGN_SYSTEM_DEMO, then copy COWORK prompt to Cowork.

### Q: Which file has the component code?
**A**: **COWORK_GESTIONALE_IMPLEMENTATION.md** → Phase 2, or **MASTERPLAN** → Design System section.

### Q: How do I style something green instead of amber?
**A**: **MASTERPLAN** → Design System → Color Palette. Change `--crt-amber` to `--crt-green` in CSS.

### Q: Can I change the CRT effects?
**A**: Yes! Edit `crt.css` in app/src/styles/. See MASTERPLAN → Visual Effects for parameters.

### Q: What if I want to add a new component?
**A**: Follow the pattern in existing components (Button, Input, etc). See MASTERPLAN → Component Library.

---

## 🤝 CONTRIBUTING

When working on this project:

1. Follow the design system (use CSS variables)
2. Match the CRT aesthetic (green/amber on black)
3. Test on mobile & desktop
4. Document as you go
5. Keep code minimal & performant
6. Use semantic HTML

---

## 📞 SUPPORT

Questions? Reach out:
- **Email**: daniel.giardina@gmail.com
- **Issues**: https://github.com/FineDiMondo/Genealogia/issues
- **Discussions**: https://github.com/FineDiMondo/Genealogia/discussions

---

## 📊 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-03-15 | Initial masterplan & design system |
| (TBD) | (TBD) | Phase implementations |

---

## 📄 LICENSE

This project is part of **Fine di Mondo** (Registered APS)

- Code: MIT License
- Documentation: CC-BY-4.0
- Genealogy Data: Personal use only

---

## 🎉 ACKNOWLEDGMENTS

- **Design Inspiration**: IBM System/370 mainframes
- **CRT Effects**: Classic terminal aesthetics
- **Genealogy Data**: Ancestry.com + FamilySearch
- **Community**: Fine di Mondo members

---

## 🚀 GETTING STARTED NOW

1. **Read MASTERPLAN** (15 mins) - Get the vision
2. **Open DESIGN_SYSTEM_DEMO** (5 mins) - See it in action
3. **Copy COWORK prompt** (30 mins) - Plan the work
4. **Execute Phase 1** (1 week) - Start building

**That's it!** You're ready to build the most elegant genealogy gestionale ever created. 

🖥️✨

---

**BUONA FORTUNA, BRO!** 🧬

**Versione**: 1.0 | **Data**: 2024-03-15 | **Status**: 🟢 Ready
