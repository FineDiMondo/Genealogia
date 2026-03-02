SCUMM-like engine WebAssembly build (SDL2 + Emscripten)

Requirements:
- Docker Desktop
- Network access to pull image emscripten/emsdk:latest

Local build (Windows):
1) From repo root:
   engine_scummlike_web\build_web.cmd
2) Output files are generated in:
   engine_scummlike_web\dist\
   - index.html
   - index.js
   - index.wasm
   - index.data (when assets are preloaded)

Manual docker command:
docker run --rm -v "%cd%:/src" -w /src emscripten/emsdk:latest bash -lc "mkdir -p engine_scummlike_web/dist && emcc engine_scummlike_web/src/main.c -O3 -sUSE_SDL=2 -sALLOW_MEMORY_GROWTH=1 -sMAX_WEBGL_VERSION=2 -sMIN_WEBGL_VERSION=2 --preload-file engine_scummlike_web/assets@/assets -o engine_scummlike_web/dist/index.html"

Assets note:
- Preloaded assets are mounted into the Emscripten virtual FS under /assets.
- The repository includes engine_scummlike_web/assets/dummy.txt so preload does not fail.
