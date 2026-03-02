@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "REPO_ROOT=%%~fI"
set "UCRT_BIN=C:\msys64\ucrt64\bin"
set "COB_CONFIG_DIR=C:\msys64\ucrt64\share\gnucobol\config"
set "PATH=%UCRT_BIN%;%PATH%"

echo [GEN-BUILD] Compilazione sorgenti COBOL...
powershell -NoProfile -ExecutionPolicy Bypass -File "%REPO_ROOT%\cobol\build.ps1"
if errorlevel 1 (
  echo [GEN-BUILD][ERRORE] Build fallita.
  exit /b 8
)

if not exist "%REPO_ROOT%\cobol\bin\GENCLI.exe" (
  echo [GEN-BUILD][ERRORE] GENCLI.exe non generato.
  exit /b 8
)
if not exist "%REPO_ROOT%\cobol\bin\GENUI00.exe" (
  echo [GEN-BUILD][ERRORE] GENUI00.exe non generato.
  exit /b 8
)

echo [GEN-BUILD] Build completata.
exit /b 0

