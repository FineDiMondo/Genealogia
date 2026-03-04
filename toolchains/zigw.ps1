param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$ErrorActionPreference = 'Stop'
$zig = Join-Path $PSScriptRoot 'zig-x86_64-windows-0.14.1\zig.exe'

if (-not (Test-Path $zig)) {
  Write-Host "(ERR) zig.exe non trovato in $zig"
  exit 2
}

& $zig @Args
exit $LASTEXITCODE
