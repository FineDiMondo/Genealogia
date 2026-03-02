@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "REPO_ROOT=%%~fI"
set "UCRT_BIN=C:\msys64\ucrt64\bin"
set "COB_CONFIG_DIR=C:\msys64\ucrt64\share\gnucobol\config"
set "PATH=%UCRT_BIN%;%PATH%"

if not exist "%REPO_ROOT%\cobol\bin\GENUI00.exe" (
  echo [GEN-UI] GENUI00.exe non trovato. Eseguo build...
  call "%SCRIPT_DIR%02_build.bat"
  if errorlevel 1 exit /b 8
)

echo [GEN-UI] Avvio interfaccia TUI...
"%REPO_ROOT%\cobol\bin\GENUI00.exe"
exit /b %ERRORLEVEL%

