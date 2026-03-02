param(
    [string]$DatasetPath,
    [string]$PagesUrl
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot/../lib/assert.ps1"
. "$PSScriptRoot/../lib/io.ps1"
. "$PSScriptRoot/../lib/config.ps1"

if (-not $DatasetPath) { $DatasetPath = DefaultDatasetPath }
$journal = Join-Path $DatasetPath "events.ndjson"
Write-Host "GN370 TEST t30_journal_integrity"
Assert-FileExists $journal "journal file exists"

$parsed = Read-NdjsonFile -Path $journal
Assert-True ($parsed.Count -gt 0) "journal has rows"

$warn = $false
$prevTs = $null
foreach ($item in $parsed.Items) {
    Assert-True (-not [string]::IsNullOrWhiteSpace([string]$item.ts)) "row has ts"
    Assert-True (-not [string]::IsNullOrWhiteSpace([string]$item.type)) "row has type"
    $hasEntity = -not [string]::IsNullOrWhiteSpace([string]$item.entity)
    $hasId = -not [string]::IsNullOrWhiteSpace([string]$item.id)
    Assert-True ($hasEntity -or $hasId) "row has entity or id"

    if ($prevTs -and ([string]$item.ts -lt [string]$prevTs)) {
        $warn = $true
    }
    $prevTs = [string]$item.ts
}

if ($warn) {
    Write-Warn "journal ts order is not monotonic non-decreasing"
    exit 0
}

Write-Ok "journal ts order monotonic non-decreasing"
exit 0
