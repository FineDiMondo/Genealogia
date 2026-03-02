@echo off
setlocal

set EXE=engine_scummlike\bin\scummlike.exe

if not exist "%EXE%" (
  echo [open_scummlike] executable not found, trying build...
  where cmake >nul 2>&1
  if %ERRORLEVEL% neq 0 (
    echo ERROR: cmake not found in PATH.
    exit /b 3
  )
  cmake -S . -B build
  if %ERRORLEVEL% neq 0 exit /b 3
  cmake --build build --config Release
  if %ERRORLEVEL% neq 0 exit /b 3
)

start "" "%EXE%"
exit /b 0
