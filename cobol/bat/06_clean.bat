@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "REPO_ROOT=%%~fI"

echo [GEN-CLEAN] Pulizia artefatti...
if exist "%REPO_ROOT%\cobol\bin\GENCLI.exe" del /q "%REPO_ROOT%\cobol\bin\GENCLI.exe"
if exist "%REPO_ROOT%\cobol\bin\GENUI00.exe" del /q "%REPO_ROOT%\cobol\bin\GENUI00.exe"
if exist "%REPO_ROOT%\cobol\logs" rmdir /s /q "%REPO_ROOT%\cobol\logs"
mkdir "%REPO_ROOT%\cobol\bin" >nul 2>nul

echo [GEN-CLEAN] Pulizia completata.
exit /b 0

