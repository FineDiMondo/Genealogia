@echo off
setlocal enabledelayedexpansion

REM Uso:
REM   wav2midi.cmd input.flac out.mid
REM Oppure:
REM   wav2midi.cmd input.wav out.mid
REM Compila Fortran se exe non presente.

set INP=%~1
set OUT=%~2
set BPM=%~3

if "%BPM%"=="" set BPM=120
if "%OUT%"=="" set OUT=tools\audio\out\output.mid

if "%INP%"=="" (
  for /f "usebackq delims=" %%F in (`powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms ^| Out-Null; $d=New-Object System.Windows.Forms.OpenFileDialog; $d.Filter='Audio Files (*.flac;*.wav)|*.flac;*.wav|FLAC (*.flac)|*.flac|WAV (*.wav)|*.wav|All files (*.*)|*.*'; $d.InitialDirectory=(Resolve-Path 'tools/audio/in').Path; if($d.ShowDialog() -eq 'OK'){ $d.FileName }"`) do set INP=%%F
)

if "%INP%"=="" (
  echo Usage: wav2midi.cmd input.(flac^|wav) output.mid [bpm]
  exit /b 2
)

REM ensure out dir
for %%D in ("%OUT%") do set OUTDIR=%%~dpD
if not exist "%OUTDIR%" mkdir "%OUTDIR%"

REM build if needed
if not exist "tools\audio\bin\wav2midi_fft.exe" (
  echo [build] wav2midi_fft.exe missing, compiling with gfortran...
  where gfortran >nul 2>&1
  if %ERRORLEVEL% neq 0 (
    echo ERROR: gfortran not found in PATH.
    exit /b 3
  )
  gfortran -O3 -ffast-math ^
    tools\audio\src\wav_io.f90 ^
    tools\audio\src\fft_radix2.f90 ^
    tools\audio\src\midi_writer.f90 ^
    tools\audio\src\wav2midi_fft.f90 ^
    -o tools\audio\bin\wav2midi_fft.exe
  if %ERRORLEVEL% neq 0 exit /b 3
)

REM If FLAC -> decode first
set EXT=%~x1
if /I "%EXT%"==".flac" (
  call tools\audio\decode_flac.cmd "%INP%" "tools\audio\out\decoded.wav"
  if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%
  set WAV=tools\audio\out\decoded.wav
) else (
  set WAV=%INP%
)

echo [run] wav2midi_fft.exe "%WAV%" "%OUT%" %BPM%
tools\audio\bin\wav2midi_fft.exe "%WAV%" "%OUT%" %BPM%
exit /b %ERRORLEVEL%
