param(
    [string]$DatasetPath,
    [string]$PagesUrl,
    [string]$Id
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot/../lib/config.ps1"

if (-not $DatasetPath) { $DatasetPath = DefaultDatasetPath }
$root = Get-RepoRoot

Write-Host "GN370 EXPLAIN                               BUILD LIVE        DATA current"
Write-Host "MODE STD370   CONTEXT EXPL MAIN             TECH RULES|INTROS AGT EXPL"
Write-Host ("-" * 78)
Write-Host "ACTIVE TECH:"
Write-Host "- MODEL: Relational 3NF (entity/relation/event separated)"
Write-Host "- ALGO : PK lookup + FK integrity checks"
Write-Host "- SRC  : NDJSON journal + entity store"
Write-Host ("-" * 78)

$py = @"
from pathlib import Path
from tools.agents.shell_runner import ShellSession
root = Path(r"$root")
migs = [
    root / "tools/db/migrations/001_gn370_next_core.sql",
    root / "tools/db/migrations/002_domain_schema.sql",
    root / "tools/db/migrations/002_seed_lexicon.sql",
    root / "tools/db/migrations/002_indexes.sql",
    root / "tools/db/migrations/003_integrity_triggers.sql",
]
s = ShellSession(db_path=root / "runtime" / "ops_explain.sqlite", migrations=migs)
s.run("job run pipeline")
out = s.run("explain")
print(out.get("output",""))
"@

$result = $py | python -
if ($LASTEXITCODE -ne 0) {
    Write-Host "(ERR) explain check failed"
    exit 2
}
Write-Host "LAST ACTION:"
Write-Host ("- {0}" -f ($result.Trim()))
Write-Host ("-" * 78)
Write-Host "COMMAND ===> _"
Write-Host ("-" * 78)
Write-Host "PF1=HELP PF3=BACK PF12=MENU"
Write-Host "STATUS: OK"
exit 0

