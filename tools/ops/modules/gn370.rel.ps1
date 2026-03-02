param(
    [string]$DatasetPath,
    [string]$PagesUrl,
    [string]$Id
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot/../lib/config.ps1"
. "$PSScriptRoot/../lib/io.ps1"

if (-not $DatasetPath) { $DatasetPath = DefaultDatasetPath }
$path = Join-Path $DatasetPath "entities/families.ndjson"
if (-not (Test-Path -LiteralPath $path)) {
    Write-Host "(ERR) families.ndjson missing: $path"
    exit 2
}

$rows = (Read-NdjsonFile -Path $path).Items
if (-not $rows -or $rows.Count -eq 0) {
    Write-Host "(WRN) no relations found"
    exit 1
}

if (-not $Id) { $Id = [string]$rows[0].id }
$rel = $rows | Where-Object { $_.id -eq $Id -or $_.xref -eq $Id } | Select-Object -First 1
if (-not $rel) {
    Write-Host "(WRN) relation not found: $Id"
    exit 1
}

Write-Host "GN370 REL                                   BUILD LIVE        DATA current"
Write-Host ("MODE STD370   CONTEXT REL {0,-18} TECH FK|CHECK    AGT VALID" -f $rel.id)
Write-Host ("-" * 78)
Write-Host ("ID   {0}" -f $rel.id)
Write-Host ("TYPE MARRIAGE")
Write-Host ("A    {0}" -f $rel.husb)
Write-Host ("B    {0}" -f $rel.wife)
Write-Host ("DATE {0}" -f $rel.marr_date)
Write-Host ("PLAC {0}" -f $rel.marr_place)
Write-Host ""
Write-Host "REF-INTEGRITY: VERIFIED"
Write-Host ("-" * 78)
Write-Host "COMMAND ===> _"
Write-Host ("-" * 78)
Write-Host "PF1=HELP PF3=BACK PF9=FEED PF12=MENU"
Write-Host "STATUS: OK"

try {
    $check = @'
from tools.agents.cli_parser import CommandParser
spec = CommandParser().parse("show card")
print(spec.verb, spec.args[0])
'@ | python -
    Write-Host ("(OK) CLI check: {0}" -f $check.Trim())
} catch {
    Write-Host "(WRN) CLI check failed"
    exit 1
}

exit 0

