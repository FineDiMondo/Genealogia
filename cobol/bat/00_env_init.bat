@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "REPO_ROOT=%%~fI"

echo [GEN-ENV] Repo root: %REPO_ROOT%

if not exist "%REPO_ROOT%\tools\gnucobol\install-gnucobol.bat" (
  echo [GEN-ENV][ERRORE] Installer non trovato: tools\gnucobol\install-gnucobol.bat
  exit /b 12
)

echo [GEN-ENV] Avvio installazione/verifica GnuCOBOL...
call "%REPO_ROOT%\tools\gnucobol\install-gnucobol.bat"
if errorlevel 1 (
  echo [GEN-ENV][ERRORE] Installazione GnuCOBOL fallita.
  exit /b 12
)

echo [GEN-ENV] Ambiente pronto.
exit /b 0

