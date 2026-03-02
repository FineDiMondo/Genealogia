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
$journalPath = Join-Path $DatasetPath "events.ndjson"

Write-Host "GN370 FEED                                  BUILD LIVE        DATA current"
Write-Host "MODE STD370   CONTEXT JOURNAL               TECH NDJSON|SCAN  AGT EXPL"
Write-Host ("-" * 78)

if (-not (Test-Path -LiteralPath $journalPath)) {
    Write-Host "(WRN) Journal file not found: $journalPath"
    exit 1
}

$result = Read-NdjsonFile -Path $journalPath
$rows = @($result.Items | Select-Object -Last 10)

Write-Host "TS                TYPE                 ENTITY      ID"
foreach ($r in $rows) {
    $line = "{0,-17} {1,-20} {2,-10} {3}" -f $r.ts, $r.type, $r.entity, $r.id
    Write-Host $line
}
Write-Host ("-" * 78)
Write-Host "COMMAND ===> FEED /LAST 10"
Write-Host ("-" * 78)
Write-Host "PF1=HELP PF3=BACK PF7=UP PF8=DOWN PF12=MENU"
Write-Host "STATUS: OK"

try {
    $check = @'
from tools.agents.cli_parser import CommandParser
spec = CommandParser().parse("feed /last 10")
print(spec.verb, spec.options.get("last"))
'@ | python -
    Write-Host ("(OK) CLI check: {0}" -f $check.Trim())
} catch {
    Write-Host "(WRN) CLI check failed"
    exit 1
}

exit 0

