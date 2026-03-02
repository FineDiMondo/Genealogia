@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "REPO_ROOT=%%~fI"
set "UCRT_BIN=C:\msys64\ucrt64\bin"
set "COB_CONFIG_DIR=C:\msys64\ucrt64\share\gnucobol\config"
set "PATH=%UCRT_BIN%;%PATH%"

echo [GEN-TEST] Avvio test COBOL CLI...
powershell -NoProfile -ExecutionPolicy Bypass -File "%REPO_ROOT%\cobol\test.ps1"
if errorlevel 1 (
  echo [GEN-TEST][ERRORE] Test falliti.
  exit /b 8
)

echo [GEN-TEST] Test OK.
exit /b 0

