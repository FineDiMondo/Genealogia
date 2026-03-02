# PHASE 1 WEEK 1-2 DEVELOPMENT ROADMAP
## Frontend Unification: PORTALE_GN → Astro /genealogy

**Project**: Genealogia Giardina  
**Phase**: 1 (Consolidation & Clarity)  
**Duration**: 2 weeks (10 business days)  
**Status**: 🚀 READY TO START  
**Branch**: `feature/phase1-frontend-unification`  

---

## 📋 QUICK START

### For Developers
1. Read this document top-to-bottom (5 min)
2. Read `CODEX_PROMPTS_PHASE1_W1-2.md` (10 min)
3. Start with PROMPT 1.1 analysis
4. Execute prompts sequentially
5. Report status after each prompt
6. Use `verify_deployment.sh` before merge

### For Project Manager
1. Check "WEEK 1 SCHEDULE" below
2. Monitor daily standups (30 min each day)
3. Use checklist to track progress
4. Escalate blockers immediately
5. Verify deployment before merge

### For QA
1. Test each component as completed
2. Check mobile responsiveness (iPhone + Android)
3. Run accessibility audit (axe DevTools)
4. Performance testing (Lighthouse >90)
5. Sign-off on checklist before merge

---

## 🎯 OBJECTIVES

### Primary Goals
✅ **Single Astro portal** at `/genealogy/` (replaces 4 portals)  
✅ **Theme toggle system** (Modern default + Retro 370 optional)  
✅ **Genealogy components** (PersonCard, SourceBadge, Timeline, FamilyTree)  
✅ **Data integration** from `/data/current/manifest.json`  
✅ **Responsive mobile-first design** (320px-1024px+)  
✅ **WCAG AA accessibility** (aria labels, semantic HTML)  

### Secondary Goals
⭐ Clean git history with descriptive commits  
⭐ Zero TypeScript/ESLint errors  
⭐ <150KB bundle size (CSS + JS gzipped)  
⭐ Lighthouse score >90 (all categories)  
⭐ Genealogy expert review & approval  

---

## 📅 WEEK 1 SCHEDULE (Days 1-5)

### Day 1 (Monday): Analysis & Design
**Slack Update**: "Starting Phase 1 Week 1 - Frontend Unification"

**Morning (9:00-12:00)**:
- [ ] Read this document + CODEX_PROMPTS_PHASE1_W1-2.md
- [ ] Execute PROMPT 1.1: Analyze PORTALE_GN HTML structure
- [ ] Execute PROMPT 1.2: Audit current Astro app state
- **Deliverable**: REPORT_PROMPT_1_1_1_2.md (analysis complete)

**Afternoon (13:00-17:00)**:
- [ ] Execute PROMPT 2.1: Design genealogy design system
- [ ] Execute PROMPT 2.2: Astro component architecture design
- **Deliverable**: Design spec + component wireframes

**Day 1 Report** (EOD):
```
✅ Analysis complete
✅ Design system spec created
⏭️  Ready to start implementation
```

### Day 2 (Tuesday): CSS & Base Components
**Slack Update**: "Implementing design system & base components"

**Morning (9:00-12:00)**:
- [ ] Execute PROMPT 3.1: Create design-system.css
- [ ] Verify CSS variables, typography, spacing, colors
- **Deliverable**: app/src/styles/design-system.css (150+ lines)

**Afternoon (13:00-17:00)**:
- [ ] Create design tokens file (if not in CSS)
- [ ] Test design system in isolation
- [ ] QA: Visual check (colors, fonts, spacing)
- **Deliverable**: Working CSS foundation

**Day 2 Report** (EOD):
```
✅ design-system.css created & tested
✅ All design tokens defined
⏭️  Ready for component migration
```

### Day 3 (Wednesday): Component Migration
**Slack Update**: "Migrating PORTALE_GN → Astro components"

**Morning (9:00-12:00)**:
- [ ] Execute PROMPT 3.2: Migrate HTML components to Astro
- [ ] Create PersonCard.astro, SourceBadge.astro, Timeline.astro, FamilyTree.astro
- **Deliverable**: 4-6 genealogy components

**Afternoon (13:00-17:00)**:
- [ ] Test each component in isolation
- [ ] QA: Mobile responsive (iPhone)
- [ ] QA: Accessibility (WCAG AA)
- **Deliverable**: All components tested & verified

**Day 3 Report** (EOD):
```
✅ All genealogy components created
✅ Components tested on mobile
✅ Accessibility verified
⏭️  Ready for page creation
```

### Day 4 (Thursday): Pages & Theme Toggle
**Slack Update**: "Creating genealogy pages & theme system"

**Morning (9:00-12:00)**:
- [ ] Execute PROMPT 3.3: Create genealogy pages
- [ ] Create index.astro (home), search.astro, person/[id].astro
- [ ] Create family/[id].astro, place/[id].astro
- **Deliverable**: 5-6 genealogy pages

**Afternoon (13:00-17:00)**:
- [ ] Execute PROMPT 4.1: Implement theme toggle system
- [ ] Create modern.css + retro-370.css themes
- [ ] Create ThemeToggle.astro component
- [ ] Test theme toggle (Modern ↔ Retro)
- **Deliverable**: Working theme system

**Day 4 Report** (EOD):
```
✅ All genealogy pages created
✅ Theme toggle implemented
✅ Modern & retro themes working
⏭️  Ready for data integration & testing
```

### Day 5 (Friday): Integration & Testing
**Slack Update**: "Integrating data & final testing"

**Morning (9:00-12:00)**:
- [ ] Data integration: Connect to /data/current/manifest.json
- [ ] Test data loading on all pages
- [ ] Create search implementation (Levenshtein matching)
- **Deliverable**: Working data integration

**Afternoon (13:00-17:00)**:
- [ ] Full testing suite:
  - [ ] npm run build (no errors)
  - [ ] Mobile responsive (iPhone + Android)
  - [ ] Accessibility audit (axe DevTools)
  - [ ] Performance (Lighthouse >90)
  - [ ] Theme toggle (localStorage persistence)
- [ ] `bash verify_deployment.sh` (all checks pass)
- **Deliverable**: All tests passing

**Day 5 Report** (EOD):
```
✅ Data integration complete
✅ All tests passing
✅ Deployment verification passed
✅ Ready to merge to main
```

---

## 📅 WEEK 2 SCHEDULE (Days 6-10)

### Day 6 (Monday): Refinement & Polish
**Slack Update**: "Week 2: Refinement & optimization"

**Morning (9:00-12:00)**:
- [ ] Code review (self-review):
  - [ ] Check TypeScript types are correct
  - [ ] Check responsive breakpoints work
  - [ ] Check component props are typed
  - [ ] Check no console errors
- [ ] Performance optimization:
  - [ ] Check image optimization (lazy loading, WebP)
  - [ ] Check CSS is scoped (no global conflicts)
  - [ ] Check bundle size <150KB

**Afternoon (13:00-17:00)**:
- [ ] Accessibility improvements:
  - [ ] Screen reader testing (NVDA or VoiceOver)
  - [ ] Keyboard navigation (Tab, Enter, Arrows)
  - [ ] Color contrast (WCAG AA)
- [ ] Mobile testing (real devices or emulator)

**Day 6 Report** (EOD):
```
✅ Code review passed
✅ Performance optimized
✅ Accessibility verified
⏭️  Ready for genealogy expert review
```

### Day 7 (Tuesday): Expert Review & Feedback
**Slack Update**: "Expert genealogy review scheduled"

**Morning (9:00-12:00)**:
- [ ] Genealogy expert review:
  - [ ] Review design (is it credible for genealogy?)
  - [ ] Review component accuracy (person card, timeline, tree)
  - [ ] Review source attribution display
  - [ ] Provide feedback on UX

**Afternoon (13:00-17:00)**:
- [ ] Incorporate expert feedback:
  - [ ] Adjust layout if needed
  - [ ] Add missing genealogy-specific details
  - [ ] Refine visual language for credibility
- [ ] Re-test after changes

**Day 7 Report** (EOD):
```
✅ Expert genealogy review complete
✅ Feedback incorporated
✅ All tests still passing
⏭️  Ready for final prep
```

### Day 8 (Wednesday): Documentation & Commit
**Slack Update**: "Documentation & final prep"

**Morning (9:00-12:00)**:
- [ ] Create component documentation:
  - [ ] README for each component (usage, props, examples)
  - [ ] Design system documentation
  - [ ] Theme toggle documentation
- [ ] Create user guides:
  - [ ] How to use new portal (genealogist guide)
  - [ ] How to contribute data (admin guide)

**Afternoon (13:00-17:00)**:
- [ ] Clean git history:
  - [ ] Squash commits if needed
  - [ ] Write descriptive commit messages
  - [ ] Rebase on main if needed
- [ ] Final verification: `bash verify_deployment.sh` (all pass)

**Day 8 Report** (EOD):
```
✅ Documentation complete
✅ Git history clean
✅ All verification checks passing
⏭️  Ready for PR & merge
```

### Day 9 (Thursday): Pull Request & Code Review
**Slack Update**: "PR ready for review: Phase 1 Frontend Unification"

**Morning (9:00-12:00)**:
- [ ] Create GitHub PR:
  - [ ] Title: "feat(phase1): Frontend unification - Astro portal + theme toggle"
  - [ ] Description: Link to ROADMAP_VISUALE.md
  - [ ] Checklist: All success criteria from "Success Criteria" section below
- [ ] Add reviewers (senior dev, genealogy expert if possible)

**Afternoon (13:00-17:00)**:
- [ ] Address code review feedback (if any)
- [ ] Re-run verification after any changes
- [ ] Get approvals from reviewers

**Day 9 Report** (EOD):
```
✅ PR created with comprehensive description
✅ Code review completed
✅ All feedback addressed
⏭️  Ready to merge
```

### Day 10 (Friday): Merge & Deploy
**Slack Update**: "Merging Phase 1 to main & deploying"

**Morning (9:00-12:00)**:
- [ ] Final verification: `bash verify_deployment.sh`
- [ ] Merge to main:
  ```bash
  git checkout main
  git pull origin main
  git merge --no-ff feature/phase1-frontend-unification
  git push origin main
  ```
- [ ] Verify GitHub Pages deploy triggered

**Afternoon (13:00-17:00)**:
- [ ] Monitor GitHub Pages deploy (check Actions tab)
- [ ] Verify deployment successful:
  ```bash
  curl -I https://finedinmondo.github.io/Genealogia/genealogy/
  # Should return 200 OK
  ```
- [ ] Test live portal:
  - [ ] Home page loads
  - [ ] Search works
  - [ ] Theme toggle works
  - [ ] Mobile responsive
  - [ ] No 404s or console errors

**Day 10 Report** (EOD):
```
✅ Phase 1 merged to main
✅ GitHub Pages deployed successfully
✅ Live portal verified & working
✅ PHASE 1 COMPLETE

Next: Phase 2 Week 3-4 (Agent Integration)
```

---

## ✅ SUCCESS CRITERIA (Must Have All)

### Functional Requirements
- [ ] Astro app builds without errors (`npm run build` → exit code 0)
- [ ] Home page (`/genealogy/index`) renders correctly
- [ ] Search page (`/genealogy/search`) works with autocomplete
- [ ] Person detail (`/genealogy/person/[id]`) renders with all data
- [ ] Family detail (`/genealogy/family/[id]`) renders
- [ ] Place detail (`/genealogy/place/[id]`) renders
- [ ] Theme toggle switches Modern ↔ Retro 370 without reload
- [ ] Theme preference persists (localStorage) across sessions
- [ ] All internal links work (no 404s)
- [ ] Data loads from `/data/current/manifest.json`

### Quality Requirements
- [ ] Mobile responsive:
  - [ ] iPhone 12 (375px): all pages work
  - [ ] iPad (768px): all pages work
  - [ ] Desktop (1024px+): all pages work
- [ ] Accessibility (WCAG 2.1 AA):
  - [ ] axe DevTools: 0 critical issues
  - [ ] Keyboard navigation works (Tab, Enter, Arrows)
  - [ ] Screen reader compatible (tested with NVDA or VoiceOver)
  - [ ] Color contrast >4.5:1 for text
- [ ] Performance:
  - [ ] Lighthouse score >90 (all categories: Performance, Accessibility, Best Practices, SEO)
  - [ ] First Contentful Paint <2s
  - [ ] Cumulative Layout Shift <0.1
  - [ ] Bundle size <150KB (CSS + JS gzipped)
- [ ] Styling:
  - [ ] No console errors or warnings
  - [ ] No TypeScript errors
  - [ ] CSS scoped (no global conflicts)
  - [ ] Responsive breakpoints work correctly (mobile, tablet, desktop)

### Git & Code Requirements
- [ ] Branch: `feature/phase1-frontend-unification` created from main
- [ ] Commits: ≥5 clean, descriptive commits (e.g., "feat(design-system): add design-system.css with tokens")
- [ ] Git history: Clean rebase on main (no merge conflicts)
- [ ] PR created with description linking to ROADMAP_VISUALE.md
- [ ] Code reviewed & approved by senior dev
- [ ] All comments addressed

### Testing Requirements
- [ ] All tests pass: `npm run test` (if test suite exists)
- [ ] Verification script passes: `bash verify_deployment.sh` (all checks ✅)
- [ ] Manual smoke tests:
  - [ ] Search for "Giovanni" (expects autocomplete)
  - [ ] Click person card (opens detail page)
  - [ ] Click theme toggle (switches Modern ↔ Retro)
  - [ ] Verify responsive (shrink browser window)
  - [ ] Verify no console errors (F12 → Console)

### Genealogy-Specific Requirements
- [ ] SourceBadge component shows DOCUMENTATO/ATTRIBUITO/TRADIZIONE
- [ ] PersonCard shows birth/death dates, place, family, source
- [ ] Timeline visualizes person lifespan with events
- [ ] FamilyTree shows recursive parent→children
- [ ] Design looks credible (not like gaming UI)
- [ ] Genealogy expert approves design

---

## 🛠️ TOOLS & SCRIPTS

### Daily Verification
```bash
# Run before each day's handoff
bash verify_deployment.sh

# Expected output:
# ✅ PASS: On correct branch
# ✅ PASS: Working directory clean
# ... (many more checks)
# ✨ ALL CHECKS PASSED! ✨
```

### Build & Test
```bash
cd app
npm install              # Install deps (only needed first time)
npm run build           # Build Astro
npm run preview         # Preview locally
npm run test            # Run tests (if available)
```

### Git Workflow
```bash
# Commit progress
git add .
git commit -m "feat(phase1-w1-d1): Analysis & design system spec"
git push origin feature/phase1-frontend-unification

# Before merge (ensure main is in PR description)
git pull origin main
npm run build  # Final build check
```

---

## 📊 TRACKING & REPORTING

### Daily Standups (9:00 AM each day)
**Format**: 5 min update
```
Yesterday:
- [x] Completed X
- [x] Completed Y

Today:
- [ ] Task A
- [ ] Task B

Blockers:
- [Blocker]: [Resolution needed]
```

### Daily Reports (5:00 PM each day)
**Format**: Slack message + written report
```
✅ PASS: [Component/task name]
⚠️ WARN: [Issue found and resolution]
⏭️ NEXT: [What's planned for tomorrow]
```

### Weekly Summary (Friday EOD)
```
WEEK 1 SUMMARY:
═══════════════════════════════════════════════════
✅ Completed Items:
  • Design system CSS created
  • 6 genealogy components migrated
  • Theme toggle implemented
  • Data integration working
  • Responsive design verified

⚠️ Issues Resolved:
  • [Issue 1]: [How resolved]
  • [Issue 2]: [How resolved]

📊 Metrics:
  • Bundle size: XXX KB
  • Lighthouse score: 95/100
  • Components completed: 6/6
  • Tests passing: Yes
  • Accessibility: WCAG AA ✅

⏭️ Next Steps (WEEK 2):
  • Polish & refinement
  • Expert genealogy review
  • Documentation
  • PR & merge to main
═══════════════════════════════════════════════════
```

---

## 🚨 BLOCKERS & ESCALATION

### Immediate Escalation (Same Day)
If you encounter:
- [ ] `npm run build` fails with errors
- [ ] TypeScript compilation errors
- [ ] Critical accessibility issue (axe DevTools critical)
- [ ] Data manifest.json missing or invalid format

**Action**: Stop, escalate to project manager immediately

### 24-Hour Escalation
If you encounter:
- [ ] Component not rendering on mobile
- [ ] Theme toggle not persisting
- [ ] Performance <80 Lighthouse score
- [ ] Genealogy expert feedback not clear

**Action**: Report in standup, plan mitigation

### Non-Blocking Issues
- [ ] Minor CSS styling adjustment
- [ ] Optional accessibility enhancement (not critical)
- [ ] Bundle size optimization (not blocking)

**Action**: Log as "nice to have", don't block progress

---

## 📞 COMMUNICATION CHANNELS

- **Daily Standups**: 9:00 AM (30 min, Slack call or video)
- **Blockers/Issues**: Slack #genealogy-phase1 channel
- **Code Review**: GitHub PR comments
- **Expert Review**: Scheduled call (genealogy expert)
- **Final Sign-Off**: Email to project manager

---

## 📝 DELIVERABLES CHECKLIST

### By End of Week 1 (Friday EOD)
- [ ] REPORT_PROMPT_1_1_1_2.md (analysis complete)
- [ ] Design system spec (from PROMPT 2.1)
- [ ] Component architecture spec (from PROMPT 2.2)
- [ ] design-system.css (150+ lines, all tokens)
- [ ] 6+ genealogy Astro components (.astro files)
- [ ] 5+ genealogy pages (.astro files)
- [ ] Theme toggle system (modern.css + retro-370.css + ThemeToggle.astro)
- [ ] Data integration (loading from manifest.json)
- [ ] verify_deployment.sh (passes all checks)
- [ ] Clean git history (5+ commits with descriptive messages)

### By End of Week 2 (Friday EOD)
- [ ] All of Week 1 above, plus:
- [ ] Component documentation (README for each component)
- [ ] User guides (genealogist + admin)
- [ ] Code reviewed & approved
- [ ] Genealogy expert approved
- [ ] GitHub PR created & merged to main
- [ ] Deployed to GitHub Pages (live & verified)
- [ ] All success criteria met

---

## 🎉 PHASE 1 COMPLETION CHECKLIST

After merge & deployment, verify:
- [ ] `https://[deployed-url]/genealogy/` loads and works
- [ ] All pages accessible (/search, /person/[id], etc.)
- [ ] Theme toggle works on live site
- [ ] Mobile responsive on real devices
- [ ] No console errors in DevTools
- [ ] Lighthouse score >90
- [ ] PORTALE_GN/portale-chiaro.html retired (or archived)
- [ ] PORTALE_GN/portale-370.html retired (theme toggle preserves feature)
- [ ] Stakeholders informed of go-live

---

## 🚀 NEXT: PHASE 2 (Week 3-4)

After Phase 1 merge, start Phase 2:
- Integrate normalization agent in GitHub Actions
- Create conflict resolution UI
- See ROADMAP_VISUALE.md "PHASE 2" section for details

---

## 📋 QUICK REFERENCE

| Document | Purpose | Who Reads |
|---|---|---|
| ROADMAP_VISUALE.md | 12-month visual roadmap | Everyone |
| CODEX_PROMPTS_PHASE1_W1-2.md | Detailed implementation prompts | Developer |
| REPORT_PROMPT_1_1_1_2.md | Analysis & migration strategy | PM + Tech Lead |
| verify_deployment.sh | Automated verification | Developer (daily) |
| This document | Phase 1 execution plan | Everyone |

---

**Status**: 🟢 READY TO LAUNCH PHASE 1  
**Start Date**: Monday ASAP  
**Duration**: 10 business days  
**Target Completion**: Friday EOW2  

✨ **Let's build it!** ✨

