Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$DataDir = Join-Path $RootDir "data"
$ArDir = Join-Path $DataDir "araldica"
$NobDir = Join-Path $DataDir "nobilta"
$Portale = Join-Path $RootDir "PORTALE_GN"
$OutDir = Join-Path $RootDir "out"
$LogDir = Join-Path $RootDir "logs"

New-Item -ItemType Directory -Force -Path `
  (Join-Path $Portale "people"), `
  (Join-Path $Portale "families"), `
  (Join-Path $Portale "sources"), `
  (Join-Path $Portale "heraldry"), `
  (Join-Path $Portale "nobilta"), `
  (Join-Path $Portale "reports"), `
  $OutDir, $LogDir | Out-Null

& (Join-Path (Split-Path -Parent $PSCommandPath) "validate_data.ps1")
if (-not $?) { exit 1 }

function Read-Dat {
  param([string]$Path)
  $rows = New-Object System.Collections.Generic.List[object]
  foreach ($line in Get-Content $Path -Encoding UTF8) {
    $t = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($t) -or $t.StartsWith("#")) { continue }
    $rows.Add($t.Split("|"))
  }
  return ,$rows
}

function Esc([string]$v) {
  if ($null -eq $v) { return "" }
  return [System.Net.WebUtility]::HtmlEncode($v)
}

function Parse-PartialDate([string]$v) {
  if ([string]::IsNullOrWhiteSpace($v)) { return $null }
  if ($v -match "^\d{4}$") { return [datetime]::ParseExact("$v-01-01","yyyy-MM-dd",$null) }
  if ($v -match "^\d{4}-\d{2}$") { return [datetime]::ParseExact("$v-01","yyyy-MM-dd",$null) }
  if ($v -match "^\d{4}-\d{2}-\d{2}$") { return [datetime]::ParseExact($v,"yyyy-MM-dd",$null) }
  return $null
}

function In-Range($refDate, [string]$dal, [string]$al) {
  if ($null -eq $refDate) { return $true }
  $d1 = Parse-PartialDate $dal
  $d2 = Parse-PartialDate $al
  if ($null -ne $d1 -and $refDate -lt $d1) { return $false }
  if ($null -ne $d2 -and $refDate -gt $d2) { return $false }
  return $true
}

$people = Read-Dat (Join-Path $DataDir "PERSONE.DAT")
$families = Read-Dat (Join-Path $DataDir "FAMIGLIE.DAT")
$sources = Read-Dat (Join-Path $DataDir "FONTI.DAT")
$events = Read-Dat (Join-Path $DataDir "EVENTI.DAT")
$casati = Read-Dat (Join-Path $ArDir "CASATI.DAT")
$rami = Read-Dat (Join-Path $ArDir "RAMI.DAT")
$stemmi = Read-Dat (Join-Path $ArDir "STEMMI.DAT")
$apps = Read-Dat (Join-Path $ArDir "APPARTENENZE.DAT")
$titoli = Read-Dat (Join-Path $NobDir "TITOLI.DAT")
$casatiTitoli = Read-Dat (Join-Path $NobDir "CASATI_TITOLI.DAT")
$personeTitoli = Read-Dat (Join-Path $NobDir "PERSONE_TITOLI.DAT")
$matrimoniTitoli = Read-Dat (Join-Path $NobDir "MATRIMONI_TITOLI.DAT")

$peopleById = @{}
$familiesById = @{}
$sourcesById = @{}
$casatiById = @{}
$ramiById = @{}
$titoliById = @{}
foreach ($r in $people) { $peopleById[$r[0]] = $r }
foreach ($r in $families) { $familiesById[$r[0]] = $r }
foreach ($r in $sources) { $sourcesById[$r[0]] = $r }
foreach ($r in $casati) { $casatiById[$r[0]] = $r }
foreach ($r in $rami) { $ramiById[$r[0]] = $r }
foreach ($r in $titoli) { $titoliById[$r[0]] = $r }

$appsByPerson = @{}
foreach ($a in $apps) {
  if (-not $appsByPerson.ContainsKey($a[1])) {
    $appsByPerson[$a[1]] = New-Object System.Collections.Generic.List[object]
  }
  $appsByPerson[$a[1]].Add($a)
}

$personTitlesByPerson = @{}
foreach ($pt in $personeTitoli) {
  if (-not $personTitlesByPerson.ContainsKey($pt[1])) {
    $personTitlesByPerson[$pt[1]] = New-Object System.Collections.Generic.List[object]
  }
  $personTitlesByPerson[$pt[1]].Add($pt)
}

$casatiTitlesByCasato = @{}
foreach ($ct in $casatiTitoli) {
  if (-not $casatiTitlesByCasato.ContainsKey($ct[1])) {
    $casatiTitlesByCasato[$ct[1]] = New-Object System.Collections.Generic.List[object]
  }
  $casatiTitlesByCasato[$ct[1]].Add($ct)
}

$marriageTitlesByPerson = @{}
foreach ($mt in $matrimoniTitoli) {
  foreach ($personRef in @($mt[2], $mt[3])) {
    if (-not $marriageTitlesByPerson.ContainsKey($personRef)) {
      $marriageTitlesByPerson[$personRef] = New-Object System.Collections.Generic.List[object]
    }
    $marriageTitlesByPerson[$personRef].Add($mt)
  }
}

function Person-RefDate($p) {
  $b = Parse-PartialDate $p[5]
  $d = Parse-PartialDate $p[7]
  if ($null -ne $b -and $null -ne $d) {
    $days = ($d - $b).Days
    return $b.AddDays([math]::Max(0,[math]::Floor($days / 2)))
  }
  if ($null -ne $b) { return $b }
  if ($null -ne $d) { return $d }
  return $null
}

function Choose-App($personId, $refDate) {
  if (-not $appsByPerson.ContainsKey($personId)) { return $null }
  $cands = @($appsByPerson[$personId] | Where-Object { In-Range $refDate $_[5] $_[6] })
  if ($cands.Count -eq 0) { return $null }
  return $cands | Sort-Object {
    $d = Parse-PartialDate $_[5]
    if ($null -eq $d) { [datetime]::ParseExact("0001-01-01","yyyy-MM-dd",$null) } else { $d }
  } -Descending | Select-Object -First 1
}

function Choose-Stemma($casatoId, $ramoId, $refDate) {
  $pick = {
    param($items, $refDateInner)
    $valid = @($items | Where-Object { In-Range $refDateInner $_[6] $_[7] })
    if ($valid.Count -eq 0) { return $null }
    return $valid | Sort-Object { [int]($_[8]) } -Descending | Select-Object -First 1
  }

  if ($ramoId) {
    $a = @($stemmi | Where-Object { $_[1] -eq $casatoId -and $_[2] -eq $ramoId })
    $x = & $pick $a $refDate
    if ($x) { return $x }
  }
  $b = @($stemmi | Where-Object { $_[1] -eq $casatoId -and [string]::IsNullOrWhiteSpace($_[2]) })
  $y = & $pick $b $refDate
  if ($y) { return $y }
  $c = @($stemmi | Where-Object { $_[1] -eq $casatoId -and $_[3] -eq "ARMIGERIA_BASE" })
  return (& $pick $c $refDate)
}

$AcqPriority = @{
  "CONCESSIONE" = 1
  "SUCCESSIONE" = 2
  "NASCITA" = 3
  "MATRIMONIO" = 4
  "USO_ONORIFICO" = 5
  "ASSUNZIONE" = 6
}
$GradePriority = @{
  "PRINCIPE" = 1
  "DUCA" = 2
  "MARCHESE" = 3
  "CONTE" = 4
  "BARONE" = 5
}

function Person-TitleRefDate($p) {
  $d = Parse-PartialDate $p[7]
  if ($null -ne $d) { return $d }
  return (Get-Date).Date
}

function Collect-PersonTitles($p) {
  $personRef = [string]$p[0]
  $ref = Person-TitleRefDate $p
  $found = New-Object System.Collections.Generic.List[object]

  if ($personTitlesByPerson.ContainsKey($personRef)) {
    $ptList = $personTitlesByPerson[$personRef]
    foreach ($pt in $ptList) {
      if ($null -eq $pt) { continue }
      if (-not (In-Range $ref $pt[3] $pt[4])) { continue }
      $t = if ($titoliById.ContainsKey($pt[2])) { $titoliById[$pt[2]] } else { @($pt[2], "", $pt[2], "", "", "") }
      $found.Add([pscustomobject]@{
        Id = $pt[2]; Denom = $t[2]; Grado = $t[4]; Dal = $pt[3]; Al = $pt[4];
        Acq = $pt[5]; Fonte = $pt[6]; Note = $pt[7]
      })
    }
  }

  if ($found.Count -eq 0) {
    if ($appsByPerson.ContainsKey($personRef)) {
      $appList = $appsByPerson[$personRef]
      foreach ($app in $appList) {
        if ($null -eq $app) { continue }
        $casKey = [string]$app[2]
        if (-not $casatiTitlesByCasato.ContainsKey($casKey)) { continue }
        $ctList = $casatiTitlesByCasato[$casKey]
        foreach ($ct in $ctList) {
          if ($null -eq $ct) { continue }
          if ($ct[5] -ne "EREDITARIO") { continue }
          if (-not (In-Range $ref $ct[3] $ct[4])) { continue }
          $t = if ($titoliById.ContainsKey($ct[2])) { $titoliById[$ct[2]] } else { @($ct[2], "", $ct[2], "", "", "") }
          $found.Add([pscustomobject]@{
            Id = $ct[2]; Denom = $t[2]; Grado = $t[4]; Dal = $ct[3]; Al = $ct[4];
            Acq = "NASCITA"; Fonte = ""; Note = "DERIVATO_DA_CASATO_$($app[2])"
          })
        }
      }
    }
  }

  if ($marriageTitlesByPerson.ContainsKey($personRef)) {
    $mtList = $marriageTitlesByPerson[$personRef]
    foreach ($mt in $mtList) {
      if ($null -eq $mt) { continue }
      if ($mt[5] -eq "NESSUN_EFFETTO") { continue }
      $mDate = Parse-PartialDate $mt[4]
      if ($null -ne $mDate -and $ref -lt $mDate) { continue }
      $t = if ($titoliById.ContainsKey($mt[6])) { $titoliById[$mt[6]] } else { @($mt[6], "", $mt[6], "", "", "") }
      $found.Add([pscustomobject]@{
        Id = $mt[6]; Denom = $t[2]; Grado = $t[4]; Dal = $mt[4]; Al = "";
        Acq = "MATRIMONIO"; Fonte = ""; Note = "$($mt[5])|FAMIGLIA=$($mt[1])"
      })
    }
  }

  $uniq = @{}
  foreach ($x in $found) {
    $k = "$($x.Id)|$($x.Acq)|$($x.Dal)|$($x.Al)"
    $uniq[$k] = $x
  }
  return @($uniq.Values | Sort-Object `
    @{Expression={ if ($AcqPriority.ContainsKey($_.Acq)) { $AcqPriority[$_.Acq] } else { 99 } }}, `
    @{Expression={ if ($GradePriority.ContainsKey(($_.Grado).ToUpperInvariant())) { $GradePriority[($_.Grado).ToUpperInvariant()] } else { 99 } }}, `
    @{Expression={$_.Denom}})
}

function Base-Page([string]$title, [string]$breadcrumb, [string]$body) {
  return @"
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$([System.Net.WebUtility]::HtmlEncode($title))</title>
<link rel="stylesheet" href="../terminal.css">
</head>
<body>
<div class="terminal">
  <header class="sys-header"><span class="sys-id">SIG-GN</span><span class="sys-meta">BUILD COBOL UNIX</span><span class="screen-id">$([System.Net.WebUtility]::HtmlEncode($title))</span></header>
  <nav class="breadcrumb">$breadcrumb</nav>
  <div class="section"><div class="section-hdr">$([System.Net.WebUtility]::HtmlEncode($title))</div><div class="section-body">$body</div></div>
  <footer class="pf-bar">
    <a class="pf" href="../index.html"><span class="pf-k">PF1</span><span class="pf-l">HOME</span></a>
    <a class="pf" href="../people/index.html"><span class="pf-k">PF4</span><span class="pf-l">PEOPLE</span></a>
    <a class="pf" href="../families/index.html"><span class="pf-k">PF5</span><span class="pf-l">FAMILIES</span></a>
    <a class="pf" href="../sources/index.html"><span class="pf-k">PF6</span><span class="pf-l">SOURCES</span></a>
    <a class="pf" href="../heraldry/index.html"><span class="pf-k">PF7</span><span class="pf-l">HERALDRY</span></a>
    <a class="pf" href="../nobilta/index.html"><span class="pf-k">PF8</span><span class="pf-l">NOBILTA</span></a>
  </footer>
</div>
<script src="../terminal.js"></script>
</body>
</html>
"@
}

function Write-Utf8NoBom {
  param([string]$Path,[string]$Content)
  $enc = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($Path, $Content, $enc)
}

Get-ChildItem (Join-Path $Portale "people") -Filter "P*.html" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem (Join-Path $Portale "families") -Filter "F*.html" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem (Join-Path $Portale "sources") -Filter "S*.html" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem (Join-Path $Portale "heraldry") -Filter "H*.html" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem (Join-Path $Portale "nobilta") -Filter "T*.html" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

$missingAssets = New-Object System.Collections.Generic.List[string]

$peopleRows = New-Object System.Collections.Generic.List[string]
foreach ($p in $people) {
  $personId = $p[0]
  $famLink = if ($p[10]) { "<a href=`"../families/$($p[10]).html`">$($p[10])</a>" } else { "-" }
  $srcLinks = @()
  if ($p[11]) {
    foreach ($sid in ($p[11].Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
      $srcLinks += "<a href=`"../sources/$sid.html`">$sid</a>"
    }
  }
  $ref = Person-RefDate $p
  $app = Choose-App $personId $ref
  $resolvedTitles = Collect-PersonTitles $p
  $stemmaLabel = "Nessuna appartenenza araldica"
  $stemmaLink = "-"
  $stemmaDetail = ""
  $stemmaImg = ""
  if ($app) {
    $cas = if ($casatiById.ContainsKey($app[2])) { $casatiById[$app[2]] } else { @("","","","","","","") }
    $ram = if ($app[3] -and $ramiById.ContainsKey($app[3])) { $ramiById[$app[3]] } else { @("","","BASE","","","") }
    $st = Choose-Stemma $app[2] $app[3] $ref
    if ($st) {
      $stemmaLabel = "$($cas[1]) / $($ram[2])"
      $stemmaLink = "<a href=`"../heraldry/$($st[0]).html`">$($st[0])</a>"
      $stemmaDetail = "$($st[3]) | DAL=$($st[6]) AL=$($st[7]) | PRIORITA=$($st[8])"
      $img = $st[5]
      $imgAbs = Join-Path $RootDir ("PORTALE_GN\" + ($img -replace "/", "\"))
      if ($img -and (Test-Path $imgAbs)) {
        $stemmaImg = "<img src=`"../$(Esc $img)`" alt=`"$(Esc $st[0])`" style=`"max-width:180px;border:1px solid var(--border-hi);`">"
      } else {
        $missingAssets.Add("MISSING_ASSET|$($st[0])|$img")
        $stemmaImg = "<div class=`"alert alert-warn`">ASSET STEMMA NON DISPONIBILE</div>"
      }
    } else {
      $stemmaLabel = "$($cas[1]) (nessuno stemma disponibile)"
    }
  }

  $titlesRows = New-Object System.Collections.Generic.List[string]
  foreach ($tt in $resolvedTitles) {
    $src = if ($tt.Fonte) { "<a href=`"../sources/$($tt.Fonte).html`">$($tt.Fonte)</a>" } else { "-" }
    $gradoLabel = if ($tt.Grado) { $tt.Grado } else { "TITOLO" }
    $titlesRows.Add("<div class=`"field-pair`"><span class=`"fl`">$(Esc $gradoLabel):</span><span class=`"fv`"><a href=`"../nobilta/$($tt.Id).html`">$(Esc $tt.Denom)</a> | $(Esc $tt.Acq) | $(Esc $tt.Dal) - $(Esc $tt.Al) | FONTE: $src</span></div>")
  }
  $titlesHtml = if ($titlesRows.Count -gt 0) { $titlesRows -join "" } else { '<div class="field-pair"><span class="fl">TITOLI:</span><span class="fv">NESSUN TITOLO ATTIVO</span></div>' }

  $body = @"
    <div class="field-pair"><span class="fl">ID:</span><span class="fv">$(Esc $personId)</span></div>
    <div class="field-pair"><span class="fl">NOME:</span><span class="fv">$(Esc $p[2]) $(Esc $p[3])</span></div>
    <div class="field-pair"><span class="fl">NASCITA:</span><span class="fv">$(Esc $p[5]) $(Esc $p[6])</span></div>
    <div class="field-pair"><span class="fl">MORTE:</span><span class="fv">$(Esc $p[7]) $(Esc $p[8])</span></div>
    <div class="field-pair"><span class="fl">FAMIGLIA:</span><span class="fv">$famLink</span></div>
    <div class="field-pair"><span class="fl">FONTI:</span><span class="fv">$(if ($srcLinks.Count -gt 0) { $srcLinks -join ", " } else { "-" })</span></div>
    <div class="divider">---------------- STEMMA RISOLTO ----------------</div>
    <div class="field-pair"><span class="fl">APPARTENENZA:</span><span class="fv">$(Esc $stemmaLabel)</span></div>
    <div class="field-pair"><span class="fl">SCHEDA STEMMA:</span><span class="fv">$stemmaLink</span></div>
    <div class="field-pair"><span class="fl">DETTAGLIO:</span><span class="fv">$(Esc $stemmaDetail)</span></div>
    <div style="margin-top:6px;">$stemmaImg</div>
    <div class="divider">---------------- TITOLI NOBILIARI ----------------</div>
    <h3>Titoli Nobiliari</h3>
    $titlesHtml
"@
  Write-Utf8NoBom -Path (Join-Path $Portale "people\$personId.html") -Content (Base-Page "PERSONA $personId" "<a href=`"../index.html`">HOME</a> / <a href=`"index.html`">PEOPLE</a> / <span class=`"curr`">$personId</span>" $body)
  $peopleRows.Add("<tr><td class=`"td-id`">$personId</td><td class=`"td-n`"><a href=`"$personId.html`">$(Esc $p[2]) $(Esc $p[3])</a></td><td>$(Esc $p[10])</td></tr>")
}
$peopleIdx = "<table class=`"tbl`"><thead><tr><th>ID</th><th>Persona</th><th>Famiglia</th></tr></thead><tbody>$($peopleRows -join '')</tbody></table>"
Write-Utf8NoBom -Path (Join-Path $Portale "people\index.html") -Content (Base-Page "INDICE PERSONE" "<a href=`"../index.html`">HOME</a> / <span class=`"curr`">PEOPLE</span>" $peopleIdx)

$famRows = New-Object System.Collections.Generic.List[string]
foreach ($f in $families) {
  $fid = $f[0]
  $members = New-Object System.Collections.Generic.List[string]
  foreach ($memberId in @($f[3], $f[4])) {
    if ($memberId) {
      $label = if ($peopleById.ContainsKey($memberId)) { "$($peopleById[$memberId][2]) $($peopleById[$memberId][3])" } else { $memberId }
      $members.Add("<a href=`"../people/$memberId.html`">$(Esc $label)</a>")
    }
  }
  if ($f[5]) {
    foreach ($childId in ($f[5].Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
      $label = if ($peopleById.ContainsKey($childId)) { "$($peopleById[$childId][2]) $($peopleById[$childId][3])" } else { $childId }
      $members.Add("<a href=`"../people/$childId.html`">$(Esc $label)</a>")
    }
  }
  $body = @"
    <div class="field-pair"><span class="fl">ID:</span><span class="fv">$fid</span></div>
    <div class="field-pair"><span class="fl">NOME:</span><span class="fv">$(Esc $f[2])</span></div>
    <div class="field-pair"><span class="fl">MATRIMONIO:</span><span class="fv">$(Esc $f[6]) $(Esc $f[7])</span></div>
    <div class="field-pair"><span class="fl">MEMBRI:</span><span class="fv">$(if ($members.Count -gt 0) { $members -join ", " } else { "-" })</span></div>
"@
  Write-Utf8NoBom -Path (Join-Path $Portale "families\$fid.html") -Content (Base-Page "FAMIGLIA $fid" "<a href=`"../index.html`">HOME</a> / <a href=`"index.html`">FAMILIES</a> / <span class=`"curr`">$fid</span>" $body)
  $famRows.Add("<tr><td class=`"td-id`">$fid</td><td class=`"td-n`"><a href=`"$fid.html`">$(Esc $f[2])</a></td><td>$(Esc $f[6])</td></tr>")
}
$famIdx = "<table class=`"tbl`"><thead><tr><th>ID</th><th>Famiglia</th><th>Data</th></tr></thead><tbody>$($famRows -join '')</tbody></table>"
Write-Utf8NoBom -Path (Join-Path $Portale "families\index.html") -Content (Base-Page "INDICE FAMIGLIE" "<a href=`"../index.html`">HOME</a> / <span class=`"curr`">FAMILIES</span>" $famIdx)

$srcRows = New-Object System.Collections.Generic.List[string]
foreach ($s in $sources) {
  $sid = $s[0]
  $cited = New-Object System.Collections.Generic.List[string]
  foreach ($p in $people) {
    if ($p[11]) {
      $list = $p[11].Split(",") | ForEach-Object { $_.Trim() }
      if ($list -contains $sid) {
        $cited.Add("<a href=`"../people/$($p[0]).html`">$(Esc $p[2]) $(Esc $p[3])</a>")
      }
    }
  }
  $body = @"
    <div class="field-pair"><span class="fl">ID:</span><span class="fv">$sid</span></div>
    <div class="field-pair"><span class="fl">TIPO:</span><span class="fv">$(Esc $s[1])</span></div>
    <div class="field-pair"><span class="fl">TITOLO:</span><span class="fv">$(Esc $s[2])</span></div>
    <div class="field-pair"><span class="fl">RIF:</span><span class="fv">$(Esc $s[5])</span></div>
    <div class="field-pair"><span class="fl">PERSONE CITATE:</span><span class="fv">$(if ($cited.Count -gt 0) { $cited -join ", " } else { "-" })</span></div>
"@
  Write-Utf8NoBom -Path (Join-Path $Portale "sources\$sid.html") -Content (Base-Page "FONTE $sid" "<a href=`"../index.html`">HOME</a> / <a href=`"index.html`">SOURCES</a> / <span class=`"curr`">$sid</span>" $body)
  $srcRows.Add("<tr><td class=`"td-id`">$sid</td><td class=`"td-n`"><a href=`"$sid.html`">$(Esc $s[2])</a></td><td>$(Esc $s[1])</td></tr>")
}
$srcIdx = "<table class=`"tbl`"><thead><tr><th>ID</th><th>Titolo</th><th>Tipo</th></tr></thead><tbody>$($srcRows -join '')</tbody></table>"
Write-Utf8NoBom -Path (Join-Path $Portale "sources\index.html") -Content (Base-Page "INDICE FONTI" "<a href=`"../index.html`">HOME</a> / <span class=`"curr`">SOURCES</span>" $srcIdx)

$herRows = New-Object System.Collections.Generic.List[string]
foreach ($h in $stemmi) {
  $hid = $h[0]
  $cas = if ($casatiById.ContainsKey($h[1])) { $casatiById[$h[1]] } else { @("","N/D","","","","","") }
  $ram = if ($h[2] -and $ramiById.ContainsKey($h[2])) { $ramiById[$h[2]] } else { @("","","BASE","","","") }
  $img = $h[5]
  $imgAbs = Join-Path $RootDir ("PORTALE_GN\" + ($img -replace "/", "\"))
  $imgHtml = "<div class=`"alert alert-warn`">ASSET NON PRESENTE</div>"
  if ($img -and (Test-Path $imgAbs)) {
    $imgHtml = "<img src=`"../$(Esc $img)`" alt=`"$hid`" style=`"max-width:220px;border:1px solid var(--border-hi);`">"
  } elseif ($img) {
    $missingAssets.Add("MISSING_ASSET|$hid|$img")
  }
  $body = @"
    <div class="field-pair"><span class="fl">ID STEMMA:</span><span class="fv">$hid</span></div>
    <div class="field-pair"><span class="fl">CASATO:</span><span class="fv">$(Esc $cas[1])</span></div>
    <div class="field-pair"><span class="fl">RAMO:</span><span class="fv">$(Esc $ram[2])</span></div>
    <div class="field-pair"><span class="fl">TIPO:</span><span class="fv">$(Esc $h[3])</span></div>
    <div class="field-pair"><span class="fl">RANGE:</span><span class="fv">$(Esc $h[6]) - $(Esc $h[7])</span></div>
    <div class="field-pair"><span class="fl">PRIORITA:</span><span class="fv">$(Esc $h[8])</span></div>
    <div class="field-pair"><span class="fl">BLAZONE:</span><span class="fv">$(Esc $h[4])</span></div>
    <div style="margin-top:8px;">$imgHtml</div>
"@
  Write-Utf8NoBom -Path (Join-Path $Portale "heraldry\$hid.html") -Content (Base-Page "STEMMA $hid" "<a href=`"../index.html`">HOME</a> / <a href=`"index.html`">HERALDRY</a> / <span class=`"curr`">$hid</span>" $body)
  $herRows.Add("<tr><td class=`"td-id`">$hid</td><td class=`"td-n`"><a href=`"$hid.html`">$(Esc $cas[1])</a></td><td>$(Esc $ram[2])</td><td>$(Esc $h[3])</td></tr>")
}
$herIdx = "<table class=`"tbl`"><thead><tr><th>ID</th><th>Casato</th><th>Ramo</th><th>Tipo</th></tr></thead><tbody>$($herRows -join '')</tbody></table>"
Write-Utf8NoBom -Path (Join-Path $Portale "heraldry\index.html") -Content (Base-Page "INDICE STEMMI" "<a href=`"../index.html`">HOME</a> / <span class=`"curr`">HERALDRY</span>" $herIdx)

$nobRows = New-Object System.Collections.Generic.List[string]
foreach ($t in $titoli) {
  $tid = $t[0]
  $casRows = New-Object System.Collections.Generic.List[string]
  foreach ($ct in @($casatiTitoli | Where-Object { $_[2] -eq $tid })) {
    $cas = if ($casatiById.ContainsKey($ct[1])) { $casatiById[$ct[1]] } else { @("", $ct[1], "", "", "", "", "") }
    $casRows.Add("<div class=`"field-pair`"><span class=`"fl`">CASATO:</span><span class=`"fv`">$(Esc $cas[1]) | $(Esc $ct[5]) | $(Esc $ct[3]) - $(Esc $ct[4])</span></div>")
  }
  $perRows = New-Object System.Collections.Generic.List[string]
  foreach ($pt in @($personeTitoli | Where-Object { $_[2] -eq $tid })) {
    $pp = if ($peopleById.ContainsKey($pt[1])) { $peopleById[$pt[1]] } else { @($pt[1], "", "", $pt[1], "", "", "", "", "", "", "", "", "") }
    $src = if ($pt[6]) { "<a href=`"../sources/$($pt[6]).html`">$($pt[6])</a>" } else { "-" }
    $perRows.Add("<div class=`"field-pair`"><span class=`"fl`">PERSONA:</span><span class=`"fv`"><a href=`"../people/$($pp[0]).html`">$(Esc $pp[2]) $(Esc $pp[3])</a> | $(Esc $pt[5]) | $(Esc $pt[3]) - $(Esc $pt[4]) | FONTE: $src</span></div>")
  }

  $body = @"
    <div class="field-pair"><span class="fl">ID TITOLO:</span><span class="fv">$(Esc $tid)</span></div>
    <div class="field-pair"><span class="fl">TIPO:</span><span class="fv">$(Esc $t[1])</span></div>
    <div class="field-pair"><span class="fl">DENOMINAZIONE:</span><span class="fv">$(Esc $t[2])</span></div>
    <div class="field-pair"><span class="fl">FEUDO:</span><span class="fv">$(Esc $t[3])</span></div>
    <div class="field-pair"><span class="fl">GRADO:</span><span class="fv">$(Esc $t[4])</span></div>
    <div class="field-pair"><span class="fl">NOTE:</span><span class="fv">$(Esc $t[5])</span></div>
    <div class="divider">---------------- CASATI ASSOCIATI ----------------</div>
    $(if ($casRows.Count -gt 0) { $casRows -join '' } else { '<div class="field-pair"><span class="fl">CASATI:</span><span class="fv">NESSUNO</span></div>' })
    <div class="divider">---------------- PERSONE TITOLATE ----------------</div>
    $(if ($perRows.Count -gt 0) { $perRows -join '' } else { '<div class="field-pair"><span class="fl">PERSONE:</span><span class="fv">NESSUNA</span></div>' })
"@
  Write-Utf8NoBom -Path (Join-Path $Portale "nobilta\$tid.html") -Content (Base-Page "TITOLO $tid" "<a href=`"../index.html`">HOME</a> / <a href=`"index.html`">NOBILTA</a> / <span class=`"curr`">$tid</span>" $body)
  $nobRows.Add("<tr><td class=`"td-id`">$tid</td><td class=`"td-n`"><a href=`"$tid.html`">$(Esc $t[2])</a></td><td>$(Esc $t[4])</td></tr>")
}
$nobIdx = "<table class=`"tbl`"><thead><tr><th>ID</th><th>Titolo</th><th>Grado</th></tr></thead><tbody>$($nobRows -join '')</tbody></table>"
Write-Utf8NoBom -Path (Join-Path $Portale "nobilta\index.html") -Content (Base-Page "INDICE TITOLI NOBILIARI" "<a href=`"../index.html`">HOME</a> / <span class=`"curr`">NOBILTA</span>" $nobIdx)

$now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$repBody = @"
<div class="field-pair"><span class="fl">GENERATO:</span><span class="fv">$now</span></div>
<div class="field-pair"><span class="fl">PERSONE:</span><span class="fv">$($people.Count)</span></div>
<div class="field-pair"><span class="fl">FAMIGLIE:</span><span class="fv">$($families.Count)</span></div>
<div class="field-pair"><span class="fl">FONTI:</span><span class="fv">$($sources.Count)</span></div>
<div class="field-pair"><span class="fl">EVENTI:</span><span class="fv">$($events.Count)</span></div>
<div class="field-pair"><span class="fl">STEMMI:</span><span class="fv">$($stemmi.Count)</span></div>
<div class="field-pair"><span class="fl">TITOLI NOBILIARI:</span><span class="fv">$($titoli.Count)</span></div>
<div class="field-pair"><span class="fl">MISSING ASSETS:</span><span class="fv">$($missingAssets.Count)</span></div>
"@
Write-Utf8NoBom -Path (Join-Path $Portale "reports\index.html") -Content (Base-Page "REPORT BUILD" "<a href=`"../index.html`">HOME</a> / <span class=`"curr`">REPORTS</span>" $repBody)

$buildLines = New-Object System.Collections.Generic.List[string]
$buildLines.Add("# BUILD_INDEX.DAT")
$buildLines.Add("# TIPO|ID|LABEL|PATH_RELATIVO")
foreach ($p in $people) { $buildLines.Add("PERSONA|$($p[0])|$($p[2]) $($p[3])|people/$($p[0]).html") }
foreach ($f in $families) { $buildLines.Add("FAMIGLIA|$($f[0])|$($f[2])|families/$($f[0]).html") }
foreach ($s in $sources) { $buildLines.Add("FONTE|$($s[0])|$($s[2])|sources/$($s[0]).html") }
foreach ($h in $stemmi) { $buildLines.Add("STEMMA|$($h[0])|$($h[1])|heraldry/$($h[0]).html") }
foreach ($t in $titoli) { $buildLines.Add("TITOLO|$($t[0])|$($t[2])|nobilta/$($t[0]).html") }
$enc = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllLines((Join-Path $OutDir "BUILD_INDEX.DAT"), $buildLines, $enc)

if ($missingAssets.Count -eq 0) {
  [IO.File]::WriteAllText((Join-Path $LogDir "missing_heraldry_assets.log"), "# NONE`n", $enc)
} else {
  [IO.File]::WriteAllLines((Join-Path $LogDir "missing_heraldry_assets.log"), ($missingAssets | Select-Object -Unique), $enc)
}

Write-Output ("BUILD|PEOPLE={0}|FAMILIES={1}|SOURCES={2}|HERALDRY={3}|NOBILTA={4}" -f $people.Count, $families.Count, $sources.Count, $stemmi.Count, $titoli.Count)
