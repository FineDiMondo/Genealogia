@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%install-gnucobol.ps1"

if not exist "%PS_SCRIPT%" (
  echo [ERRORE] Script non trovato: %PS_SCRIPT%
  exit /b 12
)

echo ==========================================
echo   INSTALLAZIONE GNUCOBOL - GENEALOGIA
echo ==========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo [ERRORE] Installazione fallita. RC=%RC%
  exit /b %RC%
)

echo [OK] Installazione completata con successo.
echo.
pause
exit /b 0

