@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "REPO_ROOT=%%~fI"
set "UCRT_BIN=C:\msys64\ucrt64\bin"
set "COB_CONFIG_DIR=C:\msys64\ucrt64\share\gnucobol\config"
set "PATH=%UCRT_BIN%;%PATH%"

echo [GEN-VERIFY] Verifica toolchain COBOL...
powershell -NoProfile -ExecutionPolicy Bypass -File "%REPO_ROOT%\tools\gnucobol\verify-gnucobol.ps1"
if errorlevel 1 (
  echo [GEN-VERIFY][ERRORE] Toolchain non valida.
  exit /b 12
)

echo [GEN-VERIFY] Toolchain OK.
exit /b 0

