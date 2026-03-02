param(
    [string]$DatasetPath,
    [string]$PagesUrl
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot/../lib/assert.ps1"
. "$PSScriptRoot/../lib/config.ps1"

if (-not $DatasetPath) { $DatasetPath = DefaultDatasetPath }

Write-Host "GN370 TEST t00_smoke"
Assert-True (Test-Path -LiteralPath $DatasetPath -PathType Container) "dataset path exists"
Assert-True (Test-Path -LiteralPath (Join-Path (Get-RepoRoot) "docs") -PathType Container) "docs folder exists"
Assert-True (Test-Path -LiteralPath (Join-Path (Get-RepoRoot) "tools/agents") -PathType Container) "tools/agents exists"

python --version *> $null
Assert-Equal 0 $LASTEXITCODE "python is available"

exit 0

