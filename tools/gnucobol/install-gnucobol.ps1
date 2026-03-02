$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$resourceDir = Join-Path $PSScriptRoot "resources"
$packageList = Join-Path $PSScriptRoot "packages.txt"
$msysInstaller = Join-Path $resourceDir "msys2-x86_64-20251213.exe"
$msysBash = "C:\msys64\usr\bin\bash.exe"
$ucrtBin = "C:\msys64\ucrt64\bin"
$configDir = "C:\msys64\ucrt64\share\gnucobol\config"

New-Item -ItemType Directory -Path $resourceDir -Force | Out-Null

function Ensure-MSYS2 {
  if (Test-Path $msysBash) {
    Write-Host "MSYS2 gia installato." -ForegroundColor Green
    return
  }

  if (Test-Path $msysInstaller) {
    Write-Host "Installo MSYS2 dal file locale: $msysInstaller"
    Start-Process -FilePath $msysInstaller -ArgumentList "in","--confirm-command","--accept-messages","--root","C:\msys64" -Wait
  } else {
    Write-Host "MSYS2 non trovato localmente. Installazione via winget..."
    winget install --id MSYS2.MSYS2 -e --accept-package-agreements --accept-source-agreements
  }

  if (-not (Test-Path $msysBash)) {
    throw "Installazione MSYS2 non riuscita: bash.exe non trovato in C:\msys64\usr\bin"
  }
}

function Install-Packages {
  $packages = Get-Content $packageList | Where-Object { $_ -and -not $_.StartsWith("#") }
  if (-not $packages) {
    throw "Nessun pacchetto in $packageList"
  }
  $pkgString = ($packages -join " ")
  $cmd = "export PATH=/ucrt64/bin:/usr/bin:`$PATH; pacman -Sy --noconfirm --needed $pkgString"
  & $msysBash -lc $cmd
}

function Persist-UserEnv {
  $current = [Environment]::GetEnvironmentVariable("Path", "User")
  if (-not $current) { $current = "" }
  if ($current -notlike "*$ucrtBin*") {
    [Environment]::SetEnvironmentVariable("Path", ($current.TrimEnd(";") + ";" + $ucrtBin).TrimStart(";"), "User")
    Write-Host "PATH utente aggiornato con $ucrtBin"
  } else {
    Write-Host "PATH utente gia contiene $ucrtBin"
  }
  [Environment]::SetEnvironmentVariable("COB_CONFIG_DIR", $configDir, "User")
  Write-Host "COB_CONFIG_DIR utente impostata su $configDir"
}

function Verify-Immediate {
  $env:Path = "$ucrtBin;$env:Path"
  if (-not $env:COB_CONFIG_DIR) {
    $env:COB_CONFIG_DIR = $configDir
  }
  cobc -V | Select-Object -First 1
}

Ensure-MSYS2
Install-Packages
Persist-UserEnv
Verify-Immediate

Write-Host "Installazione GnuCOBOL completata." -ForegroundColor Green
