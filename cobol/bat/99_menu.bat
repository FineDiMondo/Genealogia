@echo off
setlocal

:menu
cls
echo ===============================================
echo   COBOL TOOLCHAIN MENU - GENEALOGIA
echo ===============================================
echo  1^) Init ambiente (installa gnucobol)
echo  2^) Verifica toolchain
echo  3^) Verifica dati DAT
echo  4^) Build eseguibili
echo  5^) Test automatici
echo  6^) Run TUI (GENUI00)
echo  7^) Run CLI (HELP)
echo  8^) Pipeline completa
echo  9^) Clean artefatti
echo  Q^) Esci
echo.
set /p CHOICE=Scelta ^> 

if /I "%CHOICE%"=="1" call "%~dp000_env_init.bat" & pause & goto :menu
if /I "%CHOICE%"=="2" call "%~dp001_verify_toolchain.bat" & pause & goto :menu
if /I "%CHOICE%"=="3" call "%~dp002a_check_data.bat" & pause & goto :menu
if /I "%CHOICE%"=="4" call "%~dp002_build.bat" & pause & goto :menu
if /I "%CHOICE%"=="5" call "%~dp003_test.bat" & pause & goto :menu
if /I "%CHOICE%"=="6" call "%~dp004_run_ui.bat" & pause & goto :menu
if /I "%CHOICE%"=="7" call "%~dp005_run_cli.bat" HELP & pause & goto :menu
if /I "%CHOICE%"=="8" call "%~dp090_full_pipeline.bat" & pause & goto :menu
if /I "%CHOICE%"=="9" call "%~dp006_clean.bat" & pause & goto :menu
if /I "%CHOICE%"=="Q" exit /b 0

echo Scelta non valida.
timeout /t 1 >nul
goto :menu

