# Changelog

Tutte le modifiche rilevanti del progetto GN370 sono documentate in questo file.

## [0.1.0] - 2026-03-02

### Added
- Governance baseline: roadmap, definition of done, lexicon, PR template.
- Data layer versione 001/002 con schema dominio, seed lexicon, indici core.
- Trigger integrita' avanzata (subject polimorfico, reliability gate, hash-chain journal).
- Transaction manager con write atomiche e replay.
- Agent layer v1: `PARSE_AGT`, `NORM_AGT`, `VALID_AGT`, `EXPL_AGT` + message bus.
- Pipeline `IMPORT -> NORMALIZE -> VALIDATE -> JOURNAL` con test integrazione.
- Parser comandi formale + suggestion engine + shell runner reference.
- UI web 370 con banner tecnologico, suggestions, progress retro e smoke test UI.
- Workflow Pages statico (`pages-static.yml`) e workflow test Python (`tests.yml`).
- Script di verifica deploy `verify_deployment.sh`.

### Changed
- Deploy unificato su flusso statico 370: `GEDCOM -> Batch -> out/current -> static 370 -> GitHub Pages`.
- Documentazione allineata allo stack attivo unico.

### Removed
- Runtime e pipeline web legacy non attivi nel flusso di produzione.

### Fixed
- Riferimenti residui legacy nel service worker e nei controlli smoke deploy.

[0.1.0]: https://github.com/FineDiMondo/Genealogia/releases/tag/v0.1
