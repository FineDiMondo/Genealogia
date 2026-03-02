param(
    [string]$DatasetPath,
    [string]$PagesUrl
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot/../lib/assert.ps1"
. "$PSScriptRoot/../lib/config.ps1"

$root = Get-RepoRoot
Write-Host "GN370 TEST t20_agent_pipeline"

$py = @"
from pathlib import Path
from tools.agents.pipeline_runner import AgentPipeline
root = Path(r"$root")
db_path = root / "runtime" / "ops_t20.sqlite"
migs = [
    root / "tools/db/migrations/001_gn370_next_core.sql",
    root / "tools/db/migrations/002_domain_schema.sql",
    root / "tools/db/migrations/002_seed_lexicon.sql",
    root / "tools/db/migrations/002_indexes.sql",
    root / "tools/db/migrations/003_integrity_triggers.sql",
]
pipe = AgentPipeline(db_path=db_path, migrations=migs)
raw = "\\n".join([
    "0 @I1@ INDI",
    "1 NAME Mario /Rossi/",
    "1 SEX M",
    "0 @I2@ INDI",
    "1 NAME Maria /Rosi/",
    "1 SEX F",
    "0 @F1@ FAM",
    "1 HUSB @I1@",
    "1 WIFE @I2@",
])
res = pipe.import_gedcom(raw, "ops_t20.ged", session_id="ops-t20", source_id="S-OPS-T20")
print(f"parse={res['parse_completed']}")
print(f"norm={res['norm_completed']}")
print(f"entries={res['replay']['entries']}")
print(f"chain_valid={str(res['replay']['chain_valid']).lower()}")
"@

$out = $py | python -
Assert-Equal 0 $LASTEXITCODE "pipeline execution"
$text = ($out | Out-String)
$parseCompleted = [int](([regex]::Match($text, "parse=(\d+)")).Groups[1].Value)
$normCompleted = [int](([regex]::Match($text, "norm=(\d+)")).Groups[1].Value)
$entryCount = [int](([regex]::Match($text, "entries=(\d+)")).Groups[1].Value)
$chainValid = ([regex]::Match($text, "chain_valid=(true|false)")).Groups[1].Value
Write-Host "(OK) pipeline raw metrics parse=$parseCompleted norm=$normCompleted entries=$entryCount chain=$chainValid"
Assert-True ($entryCount -ge 1) "pipeline journal entries >= 1"
Assert-Equal "true" $chainValid "pipeline chain_valid true"
exit 0
