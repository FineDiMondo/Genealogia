@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "REPO_ROOT=%%~fI"
set "UCRT_BIN=C:\msys64\ucrt64\bin"
set "COB_CONFIG_DIR=C:\msys64\ucrt64\share\gnucobol\config"
set "PATH=%UCRT_BIN%;%PATH%"

if not exist "%REPO_ROOT%\cobol\bin\GENCLI.exe" (
  echo [GEN-CLI] GENCLI.exe non trovato. Eseguo build...
  call "%SCRIPT_DIR%02_build.bat"
  if errorlevel 1 exit /b 8
)

if "%~1"=="" (
  echo Uso: 05_run_cli.bat HELP ^| COUNT PERSONE ^| FIND ROSSI ^| REPORT
  echo Esempio: 05_run_cli.bat COUNT PERSONE
  exit /b 4
)

"%REPO_ROOT%\cobol\bin\GENCLI.exe" %*
exit /b %ERRORLEVEL%

