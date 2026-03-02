@echo off
setlocal enabledelayedexpansion

REM Uso:
REM   decode_flac.cmd input.flac tools\audio\out\decoded.wav
REM Dipendenze: flac.exe (preferito) oppure ffmpeg.exe
REM Se non trovi output dir, crealo.

if "%~1"=="" (
  echo Usage: decode_flac.cmd input.flac output.wav
  exit /b 2
)

set INP=%~1
set OUT=%~2
if "%OUT%"=="" set OUT=tools\audio\out\decoded.wav

for %%D in ("%OUT%") do set OUTDIR=%%~dpD
if not exist "%OUTDIR%" mkdir "%OUTDIR%"

REM Preferisci flac.exe se presente
where flac >nul 2>&1
if %ERRORLEVEL%==0 (
  echo [decode] using flac.exe
  flac -d -f "%INP%" -o "%OUT%"
  if %ERRORLEVEL% neq 0 exit /b 3
  exit /b 0
)

REM fallback ffmpeg
where ffmpeg >nul 2>&1
if %ERRORLEVEL%==0 (
  echo [decode] using ffmpeg.exe
  REM Converti a mono 16-bit PCM WAV
  ffmpeg -y -i "%INP%" -ac 1 -ar 22050 -c:a pcm_s16le "%OUT%"
  if %ERRORLEVEL% neq 0 exit /b 3
  exit /b 0
)

echo ERROR: flac.exe or ffmpeg.exe not found in PATH.
exit /b 3
