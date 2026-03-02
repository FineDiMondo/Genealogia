@echo off
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "REPO_ROOT=%%~fI"

for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "TS=%%T"
set "LOG_DIR=%REPO_ROOT%\cobol\logs\%TS%"
mkdir "%LOG_DIR%" >nul 2>nul

echo [GEN-PIPE] Log dir: %LOG_DIR%

call "%SCRIPT_DIR%00_env_init.bat" > "%LOG_DIR%\00_env_init.log" 2>&1
if errorlevel 1 goto :fail

call "%SCRIPT_DIR%01_verify_toolchain.bat" > "%LOG_DIR%\01_verify_toolchain.log" 2>&1
if errorlevel 1 goto :fail

call "%SCRIPT_DIR%02a_check_data.bat" > "%LOG_DIR%\02a_check_data.log" 2>&1
if errorlevel 1 goto :fail

call "%SCRIPT_DIR%02_build.bat" > "%LOG_DIR%\02_build.log" 2>&1
if errorlevel 1 goto :fail

call "%SCRIPT_DIR%03_test.bat" > "%LOG_DIR%\03_test.log" 2>&1
if errorlevel 1 goto :fail

echo [GEN-PIPE] PIPELINE COMPLETATA CON SUCCESSO.
echo [GEN-PIPE] Vedi log: %LOG_DIR%
exit /b 0

:fail
echo [GEN-PIPE][ERRORE] Pipeline fallita.
echo [GEN-PIPE] Ultimo RC: %ERRORLEVEL%
echo [GEN-PIPE] Controlla log in: %LOG_DIR%
exit /b %ERRORLEVEL%

