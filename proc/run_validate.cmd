@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%run_validate.ps1" %*
set "RC=%ERRORLEVEL%"
exit /b %RC%
