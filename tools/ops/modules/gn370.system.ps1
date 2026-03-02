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
if (-not $PagesUrl) { $PagesUrl = DefaultPagesUrl }

$root = Get-RepoRoot
$versionPath = Join-Path $root "version.json"
$size = 0
if (Test-Path -LiteralPath $DatasetPath) {
    $size = (Get-ChildItem -LiteralPath $DatasetPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
}

Write-Host "GN370 SYSTEM                                BUILD LIVE        DATA current"
Write-Host "MODE STD370   CONTEXT SYSTEM                TECH STATE|META   AGT READY"
Write-Host ("-" * 78)
if (Test-Path -LiteralPath $versionPath) {
    $v = Read-JsonFile -Path $versionPath
    Write-Host ("BUILD: {0}" -f $v.commit.Substring(0, [Math]::Min(7, $v.commit.Length)))
    Write-Host ("TIME : {0}" -f $v.buildTimeUtc)
    Write-Host ("DATA : {0}" -f $v.dataHash)
} else {
    Write-Host "BUILD: (missing version.json)"
}
Write-Host ("DATASET PATH : {0}" -f $DatasetPath)
Write-Host ("DATASET SIZE : {0} bytes" -f $size)
Write-Host ("PAGES URL    : {0}" -f $PagesUrl)

try {
    $pyv = python --version 2>&1
    Write-Host ("PYTHON       : {0}" -f $pyv)
} catch {
    Write-Host "PYTHON       : (WRN) not available"
}
Write-Host ("-" * 78)
Write-Host "COMMAND ===> _"
Write-Host ("-" * 78)
Write-Host "PF1=HELP PF3=BACK PF12=MENU"
Write-Host "STATUS: OK"
exit 0

