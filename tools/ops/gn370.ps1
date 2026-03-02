param(
    [switch]$Help,
    [ValidateSet("main", "feed", "person", "rel", "job", "explain", "system")]
    [string]$Module,
    [ValidateSet("all", "smoke", "cli", "pipeline", "journal", "db", "pages")]
    [string]$Test,
    [string]$DatasetPath,
    [string]$PagesUrl,
    [string]$Id
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot/lib/config.ps1"

if (-not $DatasetPath) { $DatasetPath = DefaultDatasetPath }
if (-not $PagesUrl) { $PagesUrl = DefaultPagesUrl }
$repoRoot = Get-RepoRoot
$sep = [System.IO.Path]::PathSeparator
if ([string]::IsNullOrWhiteSpace($env:PYTHONPATH)) {
    $env:PYTHONPATH = $repoRoot
} else {
    $env:PYTHONPATH = "$repoRoot$sep$($env:PYTHONPATH)"
}

function Show-Usage {
    Write-Host "GN370 OPS SHELL"
    Write-Host "Usage:"
    Write-Host "  ./tools/ops/gn370.ps1 -Help"
    Write-Host "  ./tools/ops/gn370.ps1 -Module <main|feed|person|rel|job|explain|system> [-DatasetPath <path>] [-Id <id>]"
    Write-Host "  ./tools/ops/gn370.ps1 -Test <all|smoke|cli|pipeline|journal|db|pages> [-DatasetPath <path>] [-PagesUrl <url>]"
}

function Get-PwshExecutable {
    $cmd = Get-Command pwsh -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return "powershell"
}

function Invoke-TestScript {
    param(
        [Parameter(Mandatory = $true)][string]$ScriptPath,
        [Parameter(Mandatory = $true)][string]$DatasetPath,
        [Parameter(Mandatory = $true)][string]$PagesUrl
    )
    $pwsh = Get-PwshExecutable
    & $pwsh -NoProfile -File $ScriptPath -DatasetPath $DatasetPath -PagesUrl $PagesUrl
    $script:LastTestExitCode = [int]$LASTEXITCODE
}

if ($Help -or (-not $Module -and -not $Test)) {
    Show-Usage
    exit 0
}

if ($Module) {
    $moduleScript = Join-Path $PSScriptRoot "modules/gn370.$Module.ps1"
    if (-not (Test-Path -LiteralPath $moduleScript)) {
        Write-Host "(ERR) Module script not found: $moduleScript"
        exit 2
    }
    & $moduleScript -DatasetPath $DatasetPath -PagesUrl $PagesUrl -Id $Id
    exit $LASTEXITCODE
}

if ($Test) {
    $tests = @{
        smoke    = "t00_smoke.ps1"
        cli      = "t10_cli_parser.ps1"
        pipeline = "t20_agent_pipeline.ps1"
        journal  = "t30_journal_integrity.ps1"
        db       = "t40_store_integrity.ps1"
        pages    = "t50_pages_smoke.ps1"
    }
    if ($Test -eq "all") {
        $ordered = @("smoke", "cli", "pipeline", "journal", "db", "pages")
        $maxCode = 0
        foreach ($t in $ordered) {
            $path = Join-Path $PSScriptRoot ("tests/" + $tests[$t])
            Write-Host ("-" * 78)
            Write-Host "RUN TEST: $t"
            Invoke-TestScript -ScriptPath $path -DatasetPath $DatasetPath -PagesUrl $PagesUrl
            $code = [int]$script:LastTestExitCode
            if ($code -gt $maxCode) { $maxCode = $code }
        }
        exit $maxCode
    }
    $single = Join-Path $PSScriptRoot ("tests/" + $tests[$Test])
    Invoke-TestScript -ScriptPath $single -DatasetPath $DatasetPath -PagesUrl $PagesUrl
    $singleCode = [int]$script:LastTestExitCode
    exit $singleCode
}

Write-Host "(ERR) Invalid arguments. Use -Help."
exit 2
