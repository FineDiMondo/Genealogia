# ANALISI FUNZIONALE GN370 v2.0

## Sottosistemi
- SHELL/ROUTER
- STATE
- IMPORT
- DB ENGINE
- VALIDATE
- RENDER
- SVG
- JOURNAL
- CONFIG
- MONITOR

## Flussi
1. Boot -> reset hard -> home import.
2. db import -> picker ZIP -> selezione file -> import -> READY.
3. import gedcom -> parse -> populate -> validate.
4. db export -> serializza tabelle -> zip -> download.
