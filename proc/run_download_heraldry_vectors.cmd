@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%run_download_heraldry_vectors.ps1" %*
set "RC=%ERRORLEVEL%"
exit /b %RC%
