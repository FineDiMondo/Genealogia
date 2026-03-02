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

Write-Host "GN370 JOB                                   BUILD LIVE        DATA current"
Write-Host "MODE STD370   CONTEXT JOB PIPELINE          TECH BATCH|SEQ   AGT PIPE"
Write-Host ("-" * 78)
Write-Host "IMPORT     [######------] 60%  (sim)"
Write-Host "NORMALIZE  [##----------] 20%  (sim)"
Write-Host "VALIDATE   [------------]  0%  (sim)"
Write-Host "JOURNAL    [------------]  0%  (sim)"
Write-Host ""
Write-Host "COMMAND ===> JOB RUN PIPELINE"
Write-Host ("-" * 78)

$py = @"
from pathlib import Path
from tools.agents.pipeline_runner import AgentPipeline
tmp_db = Path(r"$root") / "runtime" / "ops_job.sqlite"
migs = [
    Path(r"$root") / "tools/db/migrations/001_gn370_next_core.sql",
    Path(r"$root") / "tools/db/migrations/002_domain_schema.sql",
    Path(r"$root") / "tools/db/migrations/002_seed_lexicon.sql",
    Path(r"$root") / "tools/db/migrations/002_indexes.sql",
    Path(r"$root") / "tools/db/migrations/003_integrity_triggers.sql",
]
pipe = AgentPipeline(db_path=tmp_db, migrations=migs)
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
res = pipe.import_gedcom(raw, "ops_job.ged", session_id="ops-job", source_id="S-OPS")
print(f"parse={res['parse_completed']} norm={res['norm_completed']} entries={res['replay']['entries']}")
"@

$py | python -
if ($LASTEXITCODE -ne 0) {
    Write-Host "STATUS: ERR"
    exit 2
}

Write-Host "STATUS: RUNNING->DONE (local)"
exit 0

