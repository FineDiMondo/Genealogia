@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0db_ops.ps1" backup %*
exit /b %ERRORLEVEL%
