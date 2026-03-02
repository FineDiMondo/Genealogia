$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$cobolRoot = Join-Path $root "cobol"
$src = Join-Path $cobolRoot "src"
$copy = Join-Path $cobolRoot "copy"
$bin = Join-Path $cobolRoot "bin"

New-Item -ItemType Directory -Path $bin -Force | Out-Null

if (-not (Get-Command cobc -ErrorAction SilentlyContinue)) {
  if (Test-Path "C:\\msys64\\ucrt64\\bin\\cobc.exe") {
    $env:Path = "C:\\msys64\\ucrt64\\bin;" + $env:Path
  }
}

if (-not (Get-Command cobc -ErrorAction SilentlyContinue)) {
  Write-Host "ERRORE: cobc non trovato nel PATH." -ForegroundColor Red
  Write-Host "Installa GnuCOBOL e rilancia: .\\cobol\\build.ps1"
  exit 12
}

if (-not $env:COB_CONFIG_DIR) {
  $env:COB_CONFIG_DIR = "C:\\msys64\\ucrt64\\share\\gnucobol\\config"
}

$outExe = Join-Path $bin "GENCLI.exe"
$outUi = Join-Path $bin "GENUI00.exe"

Push-Location $root
try {
  cobc -x -free `
    -I "$copy" `
    -o "$outExe" `
    "$src\\GENCLI.cbl" `
    "$src\\GENCNT00.cbl" `
    "$src\\GENSRH00.cbl" `
    "$src\\GENRPT00.cbl"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Build fallita, RC=$LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
  }
  cobc -x -free `
    -I "$copy" `
    -o "$outUi" `
    "$src\\GENUI00.cbl" `
    "$src\\GENCNT00.cbl" `
    "$src\\GENSRH00.cbl" `
    "$src\\GENRPT00.cbl"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Build UI fallita, RC=$LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
  }
  Write-Host "Build completata:" -ForegroundColor Green
  Write-Host " - $outExe"
  Write-Host " - $outUi"
  exit 0
}
finally {
  Pop-Location
}
