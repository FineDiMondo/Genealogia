Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$candidates = @(
  "C:\Program Files\Git\bin\bash.exe",
  "C:\Program Files\Git\usr\bin\bash.exe"
)

$bashPath = $null
foreach ($candidate in $candidates) {
  if (Test-Path $candidate) {
    $bashPath = $candidate
    break
  }
}

if (-not $bashPath) {
  Write-Output ("ERR|BASH_NOT_FOUND|CANDIDATES={0}" -f ($candidates -join ","))
  exit 1
}

Write-Output "OK|BASH_FOUND|$bashPath"

$bashDir = Split-Path -Parent $bashPath
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$userEntries = @()
$seen = New-Object "System.Collections.Generic.HashSet[string]" ([System.StringComparer]::OrdinalIgnoreCase)

foreach ($entry in ($userPath -split ';')) {
  $trimmed = $entry.Trim()
  if (-not $trimmed) { continue }
  $normalized = $trimmed.TrimEnd('\')
  if ($seen.Add($normalized)) {
    $userEntries += $trimmed
  }
}

$bashNorm = $bashDir.TrimEnd('\')
$pathUpdated = $false
if (-not $seen.Contains($bashNorm)) {
  $userEntries += $bashDir
  $pathUpdated = $true
}

try {
  $newUserPath = [string]::Join(';', $userEntries)
  [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
  if ($pathUpdated) {
    Write-Output "OK|PATH_UPDATED|USER"
  } else {
    Write-Output "OK|PATH_ALREADY_SET|USER"
  }
} catch {
  Write-Output ("ERR|PATH_UPDATE_FAILED|{0}" -f $_.Exception.Message)
  exit 1
}

# Ensure current session can use bash immediately.
$sessionEntries = @()
$sessionSeen = New-Object "System.Collections.Generic.HashSet[string]" ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($entry in ($env:Path -split ';')) {
  $trimmed = $entry.Trim()
  if (-not $trimmed) { continue }
  $normalized = $trimmed.TrimEnd('\')
  if ($sessionSeen.Add($normalized)) {
    $sessionEntries += $trimmed
  }
}
if (-not $sessionSeen.Contains($bashNorm)) {
  $env:Path = "$bashDir;$($env:Path)"
}

try {
  $versionLine = & $bashPath --version 2>$null | Select-Object -First 1
  if (-not $versionLine) {
    throw "No version output from bash."
  }
  Write-Output "OK|BASH_TEST|$versionLine"
} catch {
  Write-Output ("ERR|BASH_TEST_FAILED|{0}" -f $_.Exception.Message)
  exit 1
}

Write-Output "INFO|REOPEN_TERMINAL|Riapri il terminale per la persistenza completa del PATH utente."
