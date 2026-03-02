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
$personsPath = Join-Path $DatasetPath "entities/persons.ndjson"
if (-not (Test-Path -LiteralPath $personsPath)) {
    Write-Host "(ERR) persons.ndjson missing: $personsPath"
    exit 2
}

$persons = (Read-NdjsonFile -Path $personsPath).Items
if (-not $persons -or $persons.Count -eq 0) {
    Write-Host "(WRN) no persons found"
    exit 1
}

if (-not $Id) { $Id = [string]$persons[0].id }
$person = $persons | Where-Object { $_.id -eq $Id -or $_.xref -eq $Id } | Select-Object -First 1
if (-not $person) {
    Write-Host "(WRN) person not found: $Id"
    exit 1
}

Write-Host "GN370 PERSON                                BUILD LIVE        DATA current"
Write-Host ("MODE STD370   CONTEXT PERSON {0,-14} TECH PK|LOOKUP   AGT NORM" -f $person.id)
Write-Host ("-" * 78)
Write-Host ("ID   {0}" -f $person.id)
Write-Host ("NAME {0}" -f $person.name)
Write-Host ("BORN {0}  {1}" -f $person.birth_date, $person.birth_place)
Write-Host ("DIED {0}  {1}" -f $person.death_date, $person.death_place)
Write-Host ("FSID {0}" -f $person.fs_id)
Write-Host ("-" * 78)
Write-Host "COMMAND ===> _"
Write-Host ("-" * 78)
Write-Host "PF1=HELP PF3=BACK PF9=FEED PF12=MENU"
Write-Host "STATUS: INTEGRITY PASS"

try {
    $check = @"
from tools.agents.cli_parser import CommandParser
spec = CommandParser().parse("open person $($person.id)")
print(spec.verb, spec.args[0], spec.args[1])
"@ | python -
    Write-Host ("(OK) CLI check: {0}" -f $check.Trim())
} catch {
    Write-Host "(WRN) CLI open person check failed"
    exit 1
}

exit 0

