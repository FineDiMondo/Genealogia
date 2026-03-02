$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$exe = Join-Path $root "cobol\\bin\\GENCLI.exe"
$ucrtBin = "C:\\msys64\\ucrt64\\bin"

if (Test-Path $ucrtBin) {
  $env:Path = "$ucrtBin;$env:Path"
}

if (-not (Test-Path $exe)) {
  Write-Host "GENCLI.exe non trovato, provo build..." -ForegroundColor Yellow
  & (Join-Path $root "cobol\\build.ps1")
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Impossibile testare senza build valida." -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

Write-Host "== TEST 1: HELP ==" -ForegroundColor Cyan
& $exe HELP
$rc1 = $LASTEXITCODE

Write-Host "== TEST 2: COUNT PERSONE ==" -ForegroundColor Cyan
& $exe COUNT PERSONE
$rc2 = $LASTEXITCODE

Write-Host "== TEST 3: COUNT FAMIGLIE ==" -ForegroundColor Cyan
& $exe COUNT FAMIGLIE
$rc3 = $LASTEXITCODE

Write-Host "== TEST 4: FIND ROSSI ==" -ForegroundColor Cyan
& $exe FIND ROSSI
$rc4 = $LASTEXITCODE

Write-Host "== TEST 5: REPORT ==" -ForegroundColor Cyan
& $exe REPORT
$rc5 = $LASTEXITCODE

$worst = @($rc1, $rc2, $rc3, $rc4, $rc5) | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum
Write-Host "RC test massimo: $worst"
exit $worst
