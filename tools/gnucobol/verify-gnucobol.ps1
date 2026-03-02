$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ucrtBin = "C:\msys64\ucrt64\bin"
$configDir = "C:\msys64\ucrt64\share\gnucobol\config"

if (Test-Path $ucrtBin) {
  $env:Path = "$ucrtBin;$env:Path"
}
if (-not $env:COB_CONFIG_DIR -and (Test-Path $configDir)) {
  $env:COB_CONFIG_DIR = $configDir
}

if (-not (Get-Command cobc -ErrorAction SilentlyContinue)) {
  Write-Host "ERRORE: cobc non trovato nel PATH." -ForegroundColor Red
  exit 12
}

Write-Host "Versione cobc:" -ForegroundColor Cyan
cobc -V

$tmp = Join-Path $env:TEMP "cobol_verify"
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
$hello = Join-Path $tmp "HELLO.cbl"
$exe = Join-Path $tmp "HELLO.exe"

@"
       IDENTIFICATION DIVISION.
       PROGRAM-ID. HELLO.
       PROCEDURE DIVISION.
           DISPLAY "HELLO COBOL".
           GOBACK.
"@ | Set-Content $hello -Encoding ASCII

cobc -x -free -o $exe $hello
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERRORE: compilazione HELLO fallita." -ForegroundColor Red
  exit $LASTEXITCODE
}

& $exe
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERRORE: esecuzione HELLO fallita." -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host "Toolchain GnuCOBOL verificata con successo." -ForegroundColor Green
exit 0
