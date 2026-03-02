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
$paths = Get-PathConventions -DatasetPath $DatasetPath

Write-Host "GN370 TEST t40_store_integrity"
Assert-FileExists $paths.PersonsFile "persons store exists"
Assert-FileExists $paths.FamiliesFile "families store exists"

$persons = (Read-NdjsonFile -Path $paths.PersonsFile).Items
$families = (Read-NdjsonFile -Path $paths.FamiliesFile).Items

$personByXref = @{}
$personById = @{}
$warn = $false
foreach ($p in $persons) {
    if ($p.xref) { $personByXref[[string]$p.xref] = $true }
    if ($p.id) { $personById[[string]$p.id] = $true }
}

foreach ($f in $families) {
    if ($f.husb) {
        if ($personByXref.ContainsKey([string]$f.husb)) {
            Write-Ok "family husb ref exists: $($f.husb)"
        } else {
            Write-Warn "family husb ref missing: $($f.husb)"
            $warn = $true
        }
    }
    if ($f.wife) {
        if ($personByXref.ContainsKey([string]$f.wife)) {
            Write-Ok "family wife ref exists: $($f.wife)"
        } else {
            Write-Warn "family wife ref missing: $($f.wife)"
            $warn = $true
        }
    }
    if ($f.children) {
        $children = ([string]$f.children).Split(",", [System.StringSplitOptions]::RemoveEmptyEntries)
        foreach ($c in $children) {
            $trim = $c.Trim()
            if ($personByXref.ContainsKey($trim)) {
                Write-Ok "family child ref exists: $trim"
            } else {
                Write-Warn "family child ref missing: $trim"
                $warn = $true
            }
        }
    }
}

foreach ($idxPath in @($paths.IndexNameFile, $paths.IndexFsidFile)) {
    if (-not (Test-Path -LiteralPath $idxPath -PathType Leaf)) {
        Write-Warn "index file missing: $idxPath"
        $warn = $true
        continue
    }
    foreach ($line in (Get-Content -LiteralPath $idxPath -Encoding UTF8)) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $parts = $line.Split("|")
        Assert-True ($parts.Length -ge 2) "index line has key|value: $line"
        $target = $parts[1].Trim()
        Assert-True ($personById.ContainsKey($target)) "index target resolves to person id: $target"
    }
}

if ($warn) { exit 1 }
exit 0
