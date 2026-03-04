# Toolchains (relative folder)

Questa cartella contiene il compilatore cross-platform locale e script di build.

## Compiler installato
- `zig-x86_64-windows-0.14.1/zig.exe`

## Wrapper rapido
- `toolchains/zigw.ps1`

Esempio:
```powershell
pwsh ./toolchains/zigw.ps1 version
```

## Build multi-piattaforma
- `toolchains/build-multiplatform.ps1`

Genera:
- `hello-win.exe` (Windows)
- `libadd-macos-arm64.dylib` e `libadd-macos-x64.dylib` (macOS)
- `libadd-android-arm64.so` e `libadd-android-x64.so` (Android)

Esecuzione:
```powershell
pwsh ./toolchains/build-multiplatform.ps1
```

Output in:
- `toolchains/out/`
