@echo off
setlocal

set INP=%~1
if "%INP%"=="" set INP=data\in\rootsmagic.ged

if not exist "%INP%" goto :input_error

if not exist tools\rootsmagic\bin mkdir tools\rootsmagic\bin
if not exist data\current\entities mkdir data\current\entities
if not exist data\current\indexes mkdir data\current\indexes
if not exist data\current\meta mkdir data\current\meta

set EXE=tools\rootsmagic\bin\rm_gedcom_import.exe
if exist "%EXE%" goto :run

echo [build] compiling rm_gedcom_import.exe ...
where gcc >nul 2>nul
if %ERRORLEVEL%==0 goto :build_gcc
where clang >nul 2>nul
if %ERRORLEVEL%==0 goto :build_clang
goto :system_error

:build_gcc
gcc -O2 -std=c11 ^
  tools\rootsmagic\src\rm_hash.c ^
  tools\rootsmagic\src\rm_paths.c ^
  tools\rootsmagic\src\rm_eventlog.c ^
  tools\rootsmagic\src\rm_gedcom_parser.c ^
  tools\rootsmagic\src\rm_gedcom_import.c ^
  -o "%EXE%"
if %ERRORLEVEL% neq 0 goto :system_error
goto :run

:build_clang
clang -O2 -std=c11 ^
  tools\rootsmagic\src\rm_hash.c ^
  tools\rootsmagic\src\rm_paths.c ^
  tools\rootsmagic\src\rm_eventlog.c ^
  tools\rootsmagic\src\rm_gedcom_parser.c ^
  tools\rootsmagic\src\rm_gedcom_import.c ^
  -o "%EXE%"
if %ERRORLEVEL% neq 0 goto :system_error
goto :run

:run
echo [run] %EXE% "%INP%"
"%EXE%" "%INP%"
set RC=%ERRORLEVEL%
if %RC%==0 echo (OK) RootsMagic GEDCOM import completed.
if %RC%==1 echo (WRN) Import completed with warnings.
if %RC%==2 echo (ERR) Input error.
if %RC% GEQ 3 echo (ERR) System error.
exit /b %RC%

:input_error
echo INPUT ERROR: GEDCOM not found: %INP%
echo Export from RootsMagic and copy GEDCOM to data\in\rootsmagic.ged
exit /b 2

:system_error
echo SYSTEM ERROR: compiler not found or build failed.
exit /b 3
