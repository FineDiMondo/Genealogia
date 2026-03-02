@echo off
setlocal

set ROOT=%~dp0..
pushd "%ROOT%"

if not exist "engine_scummlike_web\\assets" mkdir "engine_scummlike_web\\assets"
if not exist "engine_scummlike_web\\assets\\dummy.txt" (
  > "engine_scummlike_web\\assets\\dummy.txt" echo ok
)
if not exist "engine_scummlike_web\\dist" mkdir "engine_scummlike_web\\dist"
if exist "web" rmdir /s /q "web"
mkdir "web"

docker run --rm -v "%cd%:/src" -w /src emscripten/emsdk:latest bash -lc "emcc engine_scummlike_web/src/main.c -O3 -sUSE_SDL=2 -sALLOW_MEMORY_GROWTH=1 -sMAX_WEBGL_VERSION=2 -sMIN_WEBGL_VERSION=2 --preload-file engine_scummlike_web/assets@/assets -o engine_scummlike_web/dist/index.html"
set RC=%ERRORLEVEL%
if not "%RC%"=="0" (
  popd
  exit /b %RC%
)

xcopy /e /i /y "engine_scummlike_web\\dist\\*" "web\\" >nul
if exist "PORTALE_GN" xcopy /e /i /y "PORTALE_GN\\*" "web\\PORTALE_GN\\" >nul
python tools\\web\\prepare_web.py web
set RC=%ERRORLEVEL%

popd
exit /b %RC%
