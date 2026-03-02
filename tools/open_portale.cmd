@echo off
echo [open_portale] >> "%GN_LOG%"
REM Open a local HTML if exists; adjust path to your PORTALE_GN
start "" "..\PORTALE_GN\index.html"
exit /b 0
