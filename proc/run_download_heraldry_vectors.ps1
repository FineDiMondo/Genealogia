param(
  [switch]$ForceNoBash
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

function Get-BashPath {
  param([switch]$SkipBash)
  if ($SkipBash) { return $null }
  $cmd = Get-Command bash -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  foreach ($candidate in @("C:\Program Files\Git\bin\bash.exe", "C:\Program Files\Git\usr\bin\bash.exe")) {
    if (Test-Path $candidate) { return $candidate }
  }
  return $null
}

function Last-Code {
  $var = Get-Variable -Name LASTEXITCODE -Scope Global -ErrorAction SilentlyContinue
  if ($null -ne $var) { return [int]$var.Value }
  if ($?) { return 0 }
  return 1
}

$bashPath = Get-BashPath -SkipBash:$ForceNoBash
if ($bashPath) {
  Write-Output "OK|BASH_FOUND|$bashPath"
  Push-Location $RootDir
  try {
    & $bashPath -lc "./proc/download_heraldry_vectors.sh"
    exit (Last-Code)
  } finally {
    Pop-Location
  }
}

Write-Output "ERR|BASH_REQUIRED|download_heraldry_vectors.sh richiede bash. Esegui .\\proc\\setup_bash_windows.ps1 oppure installa Git Bash nel PATH."
exit 1
