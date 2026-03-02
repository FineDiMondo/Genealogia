@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "REPO_ROOT=%%~fI"

echo [GEN-DATA] Verifica file DAT minimi...

set "MISSING=0"
for %%F in ("data\PERSONE.DAT" "data\FAMIGLIE.DAT" "data\EVENTI.DAT") do (
  if not exist "%REPO_ROOT%\%%~F" (
    echo [GEN-DATA][ERRORE] Mancante: %%~F
    set "MISSING=1"
  ) else (
    for %%S in ("%REPO_ROOT%\%%~F") do echo [GEN-DATA] OK %%~F ^(%%~zS bytes^)
  )
)

if "%MISSING%"=="1" exit /b 8

echo [GEN-DATA] Verifica dati completata.
exit /b 0

