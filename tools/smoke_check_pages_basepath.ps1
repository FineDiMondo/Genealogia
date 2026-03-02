$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$repoName = Split-Path -Leaf $repoRoot
$goodPrefix = "https://finedimondo.github.io/$repoName/"
$targets = @(
  (Join-Path $repoRoot "mvs"),
  (Join-Path $repoRoot "PORTALE_GN"),
  (Join-Path $repoRoot "out\\current\\site")
) | Where-Object { Test-Path $_ }

if ($targets.Count -eq 0) {
  Write-Output "WARN: no html/js files found in mvs/, PORTALE_GN/ or out/current/site/"
  exit 1
}

$files = foreach ($t in $targets) {
  Get-ChildItem -Path $t -Recurse -File | Where-Object { $_.Extension -in @(".html", ".js") }
}

$bad = New-Object System.Collections.Generic.List[object]
$attrRegex = [regex]'(?:href|src|action)\s*=\s*["'']([^"'']+)["'']'
$jsRegex = [regex]'(?:fetch\(\s*["'']([^"'']+)["'']|location\.href\s*=\s*["'']([^"'']+)["''])'

function Test-BadUrl([string]$url) {
  if ([string]::IsNullOrWhiteSpace($url)) { return $false }
  $u = $url.Trim()
  if ($u.StartsWith("#")) { return $false }
  if ($u.StartsWith("https://finedimondo.github.io/") -and -not $u.StartsWith($goodPrefix)) { return $true }
  if ($u.StartsWith("/")) { return $true }
  return $false
}

foreach ($file in $files) {
  $lineNo = 0
  Get-Content -Path $file.FullName | ForEach-Object {
    $lineNo += 1
    $line = $_

    foreach ($m in $attrRegex.Matches($line)) {
      $url = $m.Groups[1].Value
      if (Test-BadUrl $url) {
        $bad.Add([PSCustomObject]@{
          File = $file.FullName.Replace($repoRoot + "\", "")
          Line = $lineNo
          Url  = $url
        })
      }
    }

    foreach ($m in $jsRegex.Matches($line)) {
      $url = if ($m.Groups[1].Success) { $m.Groups[1].Value } else { $m.Groups[2].Value }
      if (Test-BadUrl $url) {
        $bad.Add([PSCustomObject]@{
          File = $file.FullName.Replace($repoRoot + "\", "")
          Line = $lineNo
          Url  = $url
        })
      }
    }
  }
}

if ($bad.Count -gt 0) {
  Write-Output "BAD LINKS FOUND:"
  $bad | ForEach-Object { Write-Output ("- {0}:{1} -> {2}" -f $_.File, $_.Line, $_.Url) }
  exit 1
}

Write-Output "OK: no bad absolute links detected (use relative paths)"
exit 0
