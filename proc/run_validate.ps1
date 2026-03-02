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
    & $bashPath -lc "./proc/validate_data.sh"
    $code = Last-Code
    if ($code -eq 0) { exit 0 }
    Write-Output "WARN|BASH_EXEC_FAILED|CODE=$code|FALLBACK_POWERSHELL"
    $global:LASTEXITCODE = 0
    & (Join-Path $RootDir "proc\validate_data.ps1")
    if ($?) { exit 0 }
    $var = Get-Variable -Name LASTEXITCODE -Scope Global -ErrorAction SilentlyContinue
    if ($null -ne $var) { exit [int]$var.Value }
    exit 1
  } finally {
    Pop-Location
  }
}

Write-Output "WARN|BASH_NOT_FOUND|FALLBACK_POWERSHELL"
$global:LASTEXITCODE = 0
& (Join-Path $RootDir "proc\validate_data.ps1")
if ($?) { exit 0 }
$var = Get-Variable -Name LASTEXITCODE -Scope Global -ErrorAction SilentlyContinue
if ($null -ne $var) { exit [int]$var.Value }
exit 1
