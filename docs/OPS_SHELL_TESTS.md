# OPS Shell Tests GN370

## Scopo
Suite PowerShell terminal-only per validare componenti core GN370:
- CLI parser/shell
- agent/pipeline
- integrita store/journal
- smoke pubblico GitHub Pages

## Runner principale
Script:
- `tools/ops/gn370.ps1`

Comandi principali:
```powershell
pwsh ./tools/ops/gn370.ps1 -Help
pwsh ./tools/ops/gn370.ps1 -Test all
pwsh ./tools/ops/gn370.ps1 -Test pages -PagesUrl "https://finedimondo.github.io/Genealogia/"
pwsh ./tools/ops/gn370.ps1 -Module feed
pwsh ./tools/ops/gn370.ps1 -Module person -Id "P#d26813cde2e7f17f"
```

## Parametri
- `-Module <main|feed|person|rel|job|explain|system>`
- `-Test <all|smoke|cli|pipeline|journal|db|pages>`
- `-DatasetPath <path>` default `./data/current`
- `-PagesUrl <url>` default `https://finedimondo.github.io/Genealogia/`
- `-Id <id>` usato dai moduli che aprono entita specifiche

## Exit codes
- `0` OK
- `1` WRN (non bloccante)
- `2` ERR (fail)

## Test inclusi
- `t00_smoke.ps1`: struttura base repo + python
- `t10_cli_parser.ps1`: parsing comandi/alias/errori
- `t20_agent_pipeline.ps1`: esecuzione pipeline su fixture minimale
- `t30_journal_integrity.ps1`: parse NDJSON + schema minimo + ordine ts
- `t40_store_integrity.ps1`: check referenze store e indici base
- `t50_pages_smoke.ps1`: HTTP 200 + assenza marker legacy + asset core

## Note operative
- Output in stile retro con marker `(OK)`, `(WRN)`, `(ERR)`.
- Nessuna dipendenza da UI/browser per la suite.
- Nessuna dipendenza da Astro/PWA.

