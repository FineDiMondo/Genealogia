param(
  [string]$OutDir = "toolchains/out"
)

$ErrorActionPreference = 'Stop'
$zig = Join-Path $PSScriptRoot 'zig-x86_64-windows-0.14.1\zig.exe'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$out = Join-Path $root $OutDir
$samples = Join-Path $PSScriptRoot 'samples'

if (-not (Test-Path $zig)) {
  Write-Host "(ERR) zig compiler non trovato: $zig"
  exit 2
}

New-Item -ItemType Directory -Force -Path $out | Out-Null

$hello = Join-Path $samples 'hello.c'
$add = Join-Path $samples 'add.c'

Write-Host "(OK) Build Windows exe..."
& $zig cc $hello -target x86_64-windows-gnu -o (Join-Path $out 'hello-win.exe')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "(OK) Build macOS dylib..."
& $zig cc -shared $add -target aarch64-macos -o (Join-Path $out 'libadd-macos-arm64.dylib')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $zig cc -shared $add -target x86_64-macos -o (Join-Path $out 'libadd-macos-x64.dylib')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "(OK) Build Android .so..."
$andA64 = (Join-Path $out 'libadd-android-arm64.so')
$andX64 = (Join-Path $out 'libadd-android-x64.so')
& $zig build-lib $add -target aarch64-linux-android -dynamic -O ReleaseFast -fno-sanitize-c -fno-stack-protector "-femit-bin=$andA64"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $zig build-lib $add -target x86_64-linux-android -dynamic -O ReleaseFast -fno-sanitize-c -fno-stack-protector "-femit-bin=$andX64"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "(OK) Artifacts creati in: $out"
Get-ChildItem $out | Select-Object Name, Length, LastWriteTime
