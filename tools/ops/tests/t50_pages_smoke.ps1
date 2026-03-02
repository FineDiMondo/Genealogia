param(
    [string]$DatasetPath,
    [string]$PagesUrl
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot/../lib/assert.ps1"
. "$PSScriptRoot/../lib/config.ps1"

if (-not $PagesUrl) { $PagesUrl = DefaultPagesUrl }
if (-not $PagesUrl.EndsWith("/")) { $PagesUrl = $PagesUrl + "/" }

Write-Host "GN370 TEST t50_pages_smoke"
$homeResp = Assert-Http200 -Url $PagesUrl -Message "pages home reachable"
$homeContent = [string]$homeResp.Content

Assert-True ($homeContent -notmatch "(?i)astro") "home has no ASTRO marker"
Assert-True ($homeContent -notmatch "(?i)pwa") "home has no PWA marker"
Assert-True ($homeContent -notmatch "(?i)app/public/data/current") "home has no legacy app/public/data/current ref"

[void](Assert-Http200 -Url ($PagesUrl + "index.html") -Message "index.html reachable")
[void](Assert-Http200 -Url ($PagesUrl + "assets/gn370.js") -Message "gn370.js reachable")
[void](Assert-Http200 -Url ($PagesUrl + "assets/gn370.css") -Message "gn370.css reachable")
[void](Assert-Http200 -Url ($PagesUrl + "data/current/events.ndjson") -Message "events.ndjson reachable")

try {
    [void](Assert-Http200 -Url ($PagesUrl + "version.json") -Message "version.json reachable")
} catch {
    Write-Warn "version.json not reachable"
    exit 1
}

exit 0
