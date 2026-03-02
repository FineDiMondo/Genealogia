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
$versionPath = Join-Path (Get-RepoRoot) "version.json"
$journalPath = Join-Path $DatasetPath "events.ndjson"

Write-Host "GN370 MAIN                                  BUILD LIVE        DATA current"
Write-Host "MODE STD370   CONTEXT NONE                  TECH 3NF|JOURNAL  AGT READY"
Write-Host ("-" * 78)
Write-Host "OUTPUT"
if (Test-Path -LiteralPath $versionPath) {
    $v = Read-JsonFile -Path $versionPath
    Write-Host ("> BUILD commit: {0}" -f $v.commit.Substring(0, [Math]::Min(7, $v.commit.Length)))
} else {
    Write-Host "> (WRN) version.json not found"
}
if (Test-Path -LiteralPath $journalPath) {
    $events = Read-NdjsonFile -Path $journalPath
    Write-Host ("> Events loaded: {0}" -f $events.Count)
} else {
    Write-Host "> (WRN) events.ndjson missing"
}
try {
    $parsed = @'
from tools.agents.cli_parser import CommandParser
cmd = CommandParser().parse("help")
print(cmd.verb)
'@ | python -
    Write-Host ("> CLI parser check: {0}" -f $parsed.Trim())
} catch {
    Write-Host "> (WRN) python cli parser check failed"
}
Write-Host ("-" * 78)
Write-Host "COMMAND ===> _"
Write-Host ("-" * 78)
Write-Host "PF1=HELP PF3=BACK PF12=MENU"
Write-Host "STATUS: OK"
exit 0

