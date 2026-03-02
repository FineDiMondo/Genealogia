Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$DataDir = Join-Path $RootDir "data"
$ArDir = Join-Path $DataDir "araldica"
$NobDir = Join-Path $DataDir "nobilta"
$AssetDir = Join-Path $RootDir "PORTALE_GN\assets\heraldry"
$OutDir = Join-Path $RootDir "out"
$LogDir = Join-Path $RootDir "logs"

New-Item -ItemType Directory -Force -Path $OutDir, $LogDir | Out-Null

function Read-DatRows {
  param(
    [string]$Path,
    [int]$ExpectedFields,
    [System.Collections.Generic.List[string]]$Issues
  )
  $rows = New-Object System.Collections.Generic.List[object]
  if (-not (Test-Path $Path)) {
    $Issues.Add("ERROR|$([IO.Path]::GetFileName($Path))|MISSING_FILE")
    return ,$rows
  }
  $lineNo = 0
  foreach ($line in Get-Content $Path -Encoding UTF8) {
    $lineNo++
    $t = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($t) -or $t.StartsWith("#")) { continue }
    $cols = $t.Split("|")
    if ($cols.Count -ne $ExpectedFields) {
      $Issues.Add("ERROR|$([IO.Path]::GetFileName($Path))|LINE_$lineNo|FIELD_COUNT|EXPECTED=$ExpectedFields|FOUND=$($cols.Count)")
      continue
    }
    $rows.Add([pscustomobject]@{ Line = $lineNo; Cols = $cols })
  }
  return ,$rows
}

function Test-DateIso {
  param([string]$Val)
  if ([string]::IsNullOrWhiteSpace($Val)) { return $true }
  return $Val -match "^\d{4}(-\d{2}(-\d{2})?)?$"
}

function Parse-DateVal {
  param([string]$Val)
  if ([string]::IsNullOrWhiteSpace($Val)) { return $null }
  if ($Val -match "^\d{4}$") { return [datetime]::ParseExact("$Val-01-01","yyyy-MM-dd",$null) }
  if ($Val -match "^\d{4}-\d{2}$") { return [datetime]::ParseExact("$Val-01","yyyy-MM-dd",$null) }
  if ($Val -match "^\d{4}-\d{2}-\d{2}$") { return [datetime]::ParseExact($Val,"yyyy-MM-dd",$null) }
  return $null
}

function Test-RangesOverlap {
  param([string]$Dal1,[string]$Al1,[string]$Dal2,[string]$Al2)
  $s1 = Parse-DateVal $Dal1; if ($null -eq $s1) { $s1 = [datetime]::ParseExact("0001-01-01","yyyy-MM-dd",$null) }
  $e1 = Parse-DateVal $Al1; if ($null -eq $e1) { $e1 = [datetime]::ParseExact("9999-12-31","yyyy-MM-dd",$null) }
  $s2 = Parse-DateVal $Dal2; if ($null -eq $s2) { $s2 = [datetime]::ParseExact("0001-01-01","yyyy-MM-dd",$null) }
  $e2 = Parse-DateVal $Al2; if ($null -eq $e2) { $e2 = [datetime]::ParseExact("9999-12-31","yyyy-MM-dd",$null) }
  return -not ($e1 -lt $s2 -or $e2 -lt $s1)
}

$spec = @(
  @{ Path = (Join-Path $DataDir "PERSONE.DAT"); Fields = 13; Re = "^P\d{6}$" },
  @{ Path = (Join-Path $DataDir "FAMIGLIE.DAT"); Fields = 10; Re = "^F\d{6}$" },
  @{ Path = (Join-Path $DataDir "FONTI.DAT"); Fields = 8; Re = "^S\d{6}$" },
  @{ Path = (Join-Path $DataDir "EVENTI.DAT"); Fields = 8; Re = "^E\d{6}$" },
  @{ Path = (Join-Path $ArDir "CASATI.DAT"); Fields = 7; Re = "^C\d{6}$" },
  @{ Path = (Join-Path $ArDir "RAMI.DAT"); Fields = 6; Re = "^R\d{6}$" },
  @{ Path = (Join-Path $ArDir "STEMMI.DAT"); Fields = 11; Re = "^H\d{6}$" },
  @{ Path = (Join-Path $ArDir "APPARTENENZE.DAT"); Fields = 8; Re = "^A\d{6}$" },
  @{ Path = (Join-Path $ArDir "ALLIANZE.DAT"); Fields = 7; Re = "^L\d{6}$" },
  @{ Path = (Join-Path $NobDir "TITOLI.DAT"); Fields = 6; Re = "^T\d{6}$" },
  @{ Path = (Join-Path $NobDir "CASATI_TITOLI.DAT"); Fields = 7; Re = "^CT\d{6}$" },
  @{ Path = (Join-Path $NobDir "PERSONE_TITOLI.DAT"); Fields = 8; Re = "^PT\d{6}$" },
  @{ Path = (Join-Path $NobDir "MATRIMONI_TITOLI.DAT"); Fields = 8; Re = "^MT\d{6}$" }
)

$issues = New-Object System.Collections.Generic.List[string]
$rows = @{}
$ids = @{}

foreach ($s in $spec) {
  $name = [IO.Path]::GetFileName($s.Path)
  $rows[$name] = Read-DatRows -Path $s.Path -ExpectedFields $s.Fields -Issues $issues
  $seen = New-Object "System.Collections.Generic.HashSet[string]"
  $idSet = New-Object "System.Collections.Generic.HashSet[string]"
  foreach ($r in $rows[$name]) {
    $id = $r.Cols[0]
    if ($id -notmatch $s.Re) {
      $issues.Add("ERROR|$name|LINE_$($r.Line)|BAD_ID|$id")
    }
    if ($seen.Contains($id)) {
      $issues.Add("ERROR|$name|LINE_$($r.Line)|DUPLICATE_ID|$id")
    } else {
      $seen.Add($id) | Out-Null
    }
    $idSet.Add($id) | Out-Null
  }
  $ids[$name] = $idSet
}

$personIds = $ids["PERSONE.DAT"]
$familyIds = $ids["FAMIGLIE.DAT"]
$sourceIds = $ids["FONTI.DAT"]
$casatiIds = $ids["CASATI.DAT"]
$ramiIds = $ids["RAMI.DAT"]
$titoloIds = $ids["TITOLI.DAT"]
$missingAssets = New-Object System.Collections.Generic.List[string]
$titleConflicts = New-Object System.Collections.Generic.List[string]
$marriageTitleConflicts = New-Object System.Collections.Generic.List[string]

foreach ($r in $rows["PERSONE.DAT"]) {
  $c = $r.Cols
  if (-not (Test-DateIso $c[5])) { $issues.Add("ERROR|PERSONE.DAT|LINE_$($r.Line)|BAD_DATE|COL=6|VAL=$($c[5])") }
  if (-not (Test-DateIso $c[7])) { $issues.Add("ERROR|PERSONE.DAT|LINE_$($r.Line)|BAD_DATE|COL=8|VAL=$($c[7])") }
  foreach ($fref in @($c[9], $c[10])) {
    if ($fref -and -not $familyIds.Contains($fref)) { $issues.Add("ERROR|PERSONE.DAT|LINE_$($r.Line)|MISSING_FAMILY_REF|$fref") }
  }
  if ($c[11]) {
    foreach ($sid in ($c[11].Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
      if (-not $sourceIds.Contains($sid)) { $issues.Add("ERROR|PERSONE.DAT|LINE_$($r.Line)|MISSING_SOURCE_REF|$sid") }
    }
  }
}

foreach ($r in $rows["FAMIGLIE.DAT"]) {
  $c = $r.Cols
  foreach ($pref in @($c[3], $c[4])) {
    if ($pref -and -not $personIds.Contains($pref)) { $issues.Add("ERROR|FAMIGLIE.DAT|LINE_$($r.Line)|MISSING_PERSON_REF|$pref") }
  }
  if ($c[5]) {
    foreach ($childId in ($c[5].Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
      if (-not $personIds.Contains($childId)) { $issues.Add("ERROR|FAMIGLIE.DAT|LINE_$($r.Line)|MISSING_CHILD_REF|$childId") }
    }
  }
  if (-not (Test-DateIso $c[6])) { $issues.Add("ERROR|FAMIGLIE.DAT|LINE_$($r.Line)|BAD_DATE|COL=7|VAL=$($c[6])") }
}

foreach ($r in $rows["FONTI.DAT"]) {
  $c = $r.Cols
  if (-not (Test-DateIso $c[3])) { $issues.Add("ERROR|FONTI.DAT|LINE_$($r.Line)|BAD_DATE|COL=4|VAL=$($c[3])") }
}

foreach ($r in $rows["EVENTI.DAT"]) {
  $c = $r.Cols
  if (-not (Test-DateIso $c[2])) { $issues.Add("ERROR|EVENTI.DAT|LINE_$($r.Line)|BAD_DATE|COL=3|VAL=$($c[2])") }
  if ($c[4] -and -not $personIds.Contains($c[4])) { $issues.Add("ERROR|EVENTI.DAT|LINE_$($r.Line)|MISSING_PERSON_REF|$($c[4])") }
  if ($c[5] -and -not $familyIds.Contains($c[5])) { $issues.Add("ERROR|EVENTI.DAT|LINE_$($r.Line)|MISSING_FAMILY_REF|$($c[5])") }
  if ($c[6] -and -not $sourceIds.Contains($c[6])) { $issues.Add("ERROR|EVENTI.DAT|LINE_$($r.Line)|MISSING_SOURCE_REF|$($c[6])") }
}

foreach ($r in $rows["RAMI.DAT"]) {
  $c = $r.Cols
  if ($c[1] -and -not $casatiIds.Contains($c[1])) { $issues.Add("ERROR|RAMI.DAT|LINE_$($r.Line)|MISSING_CASATO_REF|$($c[1])") }
}

foreach ($r in $rows["STEMMI.DAT"]) {
  $c = $r.Cols
  if ($c[1] -and -not $casatiIds.Contains($c[1])) { $issues.Add("ERROR|STEMMI.DAT|LINE_$($r.Line)|MISSING_CASATO_REF|$($c[1])") }
  if ($c[2] -and -not $ramiIds.Contains($c[2])) { $issues.Add("ERROR|STEMMI.DAT|LINE_$($r.Line)|MISSING_RAMO_REF|$($c[2])") }
  if (-not (Test-DateIso $c[6]) -or -not (Test-DateIso $c[7])) { $issues.Add("ERROR|STEMMI.DAT|LINE_$($r.Line)|BAD_DATE_RANGE") }
  if ($c[8] -and $c[8] -notmatch "^\d+$") { $issues.Add("ERROR|STEMMI.DAT|LINE_$($r.Line)|BAD_PRIORITY|$($c[8])") }
  if ($c[9] -and -not $sourceIds.Contains($c[9])) { $issues.Add("ERROR|STEMMI.DAT|LINE_$($r.Line)|MISSING_SOURCE_REF|$($c[9])") }
  if ($c[5] -and $c[5] -match "^assets/heraldry/") {
    $assetName = Split-Path -Leaf $c[5]
    $assetPath = Join-Path $AssetDir $assetName
    if (-not (Test-Path $assetPath)) { $missingAssets.Add("MISSING_ASSET|$($c[0])|$($c[5])") }
  }
}

foreach ($r in $rows["APPARTENENZE.DAT"]) {
  $c = $r.Cols
  if ($c[1] -and -not $personIds.Contains($c[1])) { $issues.Add("ERROR|APPARTENENZE.DAT|LINE_$($r.Line)|MISSING_PERSON_REF|$($c[1])") }
  if ($c[2] -and -not $casatiIds.Contains($c[2])) { $issues.Add("ERROR|APPARTENENZE.DAT|LINE_$($r.Line)|MISSING_CASATO_REF|$($c[2])") }
  if ($c[3] -and -not $ramiIds.Contains($c[3])) { $issues.Add("ERROR|APPARTENENZE.DAT|LINE_$($r.Line)|MISSING_RAMO_REF|$($c[3])") }
  if (-not (Test-DateIso $c[5]) -or -not (Test-DateIso $c[6])) { $issues.Add("ERROR|APPARTENENZE.DAT|LINE_$($r.Line)|BAD_DATE_RANGE") }
}

$titleSeen = @{}
foreach ($r in $rows["TITOLI.DAT"]) {
  $c = $r.Cols
  $key = $c[2].Trim().ToUpperInvariant()
  if ($titleSeen.ContainsKey($key)) {
    $issues.Add("ERROR|TITOLI.DAT|LINE_$($r.Line)|DUPLICATE_DENOMINAZIONE|$($c[2])")
  } else {
    $titleSeen[$key] = $c[0]
  }
}

foreach ($r in $rows["CASATI_TITOLI.DAT"]) {
  $c = $r.Cols
  if ($c[1] -and -not $casatiIds.Contains($c[1])) { $issues.Add("ERROR|CASATI_TITOLI.DAT|LINE_$($r.Line)|MISSING_CASATO_REF|$($c[1])") }
  if ($c[2] -and -not $titoloIds.Contains($c[2])) { $issues.Add("ERROR|CASATI_TITOLI.DAT|LINE_$($r.Line)|MISSING_TITOLO_REF|$($c[2])") }
  if ($c[5] -notin @("EREDITARIO","CONCESSIONE","USO_STORICO")) { $issues.Add("ERROR|CASATI_TITOLI.DAT|LINE_$($r.Line)|BAD_MODALITA|$($c[5])") }
  if (-not (Test-DateIso $c[3]) -or -not (Test-DateIso $c[4])) { $issues.Add("ERROR|CASATI_TITOLI.DAT|LINE_$($r.Line)|BAD_DATE_RANGE") }
}

$appsByPerson = @{}
foreach ($r in $rows["APPARTENENZE.DAT"]) {
  $c = $r.Cols
  if (-not $appsByPerson.ContainsKey($c[1])) { $appsByPerson[$c[1]] = New-Object System.Collections.Generic.List[object] }
  $appsByPerson[$c[1]].Add($c)
}

$casatiTitoli = @{}
foreach ($r in $rows["CASATI_TITOLI.DAT"]) {
  $c = $r.Cols
  $k = "$($c[2])|$($c[1])"
  if (-not $casatiTitoli.ContainsKey($k)) { $casatiTitoli[$k] = New-Object System.Collections.Generic.List[object] }
  $casatiTitoli[$k].Add($c)
}

foreach ($r in $rows["PERSONE_TITOLI.DAT"]) {
  $c = $r.Cols
  if ($c[1] -and -not $personIds.Contains($c[1])) { $issues.Add("ERROR|PERSONE_TITOLI.DAT|LINE_$($r.Line)|MISSING_PERSON_REF|$($c[1])") }
  if ($c[2] -and -not $titoloIds.Contains($c[2])) { $issues.Add("ERROR|PERSONE_TITOLI.DAT|LINE_$($r.Line)|MISSING_TITOLO_REF|$($c[2])") }
  if ($c[6] -and -not $sourceIds.Contains($c[6])) { $issues.Add("ERROR|PERSONE_TITOLI.DAT|LINE_$($r.Line)|MISSING_SOURCE_REF|$($c[6])") }
  if ($c[5] -notin @("NASCITA","SUCCESSIONE","MATRIMONIO","CONCESSIONE","ASSUNZIONE","USO_ONORIFICO")) { $issues.Add("ERROR|PERSONE_TITOLI.DAT|LINE_$($r.Line)|BAD_MODALITA_ACQUISIZIONE|$($c[5])") }
  if (-not (Test-DateIso $c[3]) -or -not (Test-DateIso $c[4])) { $issues.Add("ERROR|PERSONE_TITOLI.DAT|LINE_$($r.Line)|BAD_DATE_RANGE") }

  if ($appsByPerson.ContainsKey($c[1])) {
    $ok = $false
    foreach ($app in $appsByPerson[$c[1]]) {
      $k = "$($c[2])|$($app[2])"
      if ($casatiTitoli.ContainsKey($k)) {
        foreach ($ct in $casatiTitoli[$k]) {
          if (Test-RangesOverlap $c[3] $c[4] $ct[3] $ct[4]) { $ok = $true; break }
        }
      }
      if ($ok) { break }
    }
    if (-not $ok) {
      $issues.Add("ERROR|PERSONE_TITOLI.DAT|LINE_$($r.Line)|TITLE_OUTSIDE_CASATO_RANGE|$($c[2])")
      $titleConflicts.Add("TITLE_RANGE_CONFLICT|PERSON=$($c[1])|TITOLO=$($c[2])|LINE=$($r.Line)")
    }
  }
}

$familyMap = @{}
foreach ($r in $rows["FAMIGLIE.DAT"]) { $familyMap[$r.Cols[0]] = $r.Cols }
foreach ($r in $rows["MATRIMONI_TITOLI.DAT"]) {
  $c = $r.Cols
  if ($c[1] -and -not $familyIds.Contains($c[1])) { $issues.Add("ERROR|MATRIMONI_TITOLI.DAT|LINE_$($r.Line)|MISSING_FAMIGLIA_REF|$($c[1])") }
  if ($c[2] -and -not $personIds.Contains($c[2])) { $issues.Add("ERROR|MATRIMONI_TITOLI.DAT|LINE_$($r.Line)|MISSING_CONIUGE1_REF|$($c[2])") }
  if ($c[3] -and -not $personIds.Contains($c[3])) { $issues.Add("ERROR|MATRIMONI_TITOLI.DAT|LINE_$($r.Line)|MISSING_CONIUGE2_REF|$($c[3])") }
  if ($c[6] -and -not $titoloIds.Contains($c[6])) { $issues.Add("ERROR|MATRIMONI_TITOLI.DAT|LINE_$($r.Line)|MISSING_TITOLO_REF|$($c[6])") }
  if ($c[5] -notin @("ACQUISIZIONE_TITOLO","CONSORTE_DI","TRASMISSIONE_AI_FIGLI","NESSUN_EFFETTO")) { $issues.Add("ERROR|MATRIMONI_TITOLI.DAT|LINE_$($r.Line)|BAD_EFFETTO|$($c[5])") }
  if (-not (Test-DateIso $c[4])) { $issues.Add("ERROR|MATRIMONI_TITOLI.DAT|LINE_$($r.Line)|BAD_DATE|COL=5|VAL=$($c[4])") }
  if ($familyMap.ContainsKey($c[1])) {
    $fam = $familyMap[$c[1]]
    $s1 = $fam[3]; $s2 = $fam[4]
    if (($c[2] -ne $s1 -and $c[2] -ne $s2) -or ($c[3] -ne $s1 -and $c[3] -ne $s2)) {
      $issues.Add("ERROR|MATRIMONI_TITOLI.DAT|LINE_$($r.Line)|CONIUGI_NOT_IN_FAMILY|$($c[1])")
      $marriageTitleConflicts.Add("MARRIAGE_PERSON_MISMATCH|LINE=$($r.Line)|FAM=$($c[1])|C1=$($c[2])|C2=$($c[3])")
    }
  }
}

$report = New-Object System.Collections.Generic.List[string]
$report.Add("VALIDATION REPORT")
$report.Add("=================")
foreach ($name in @("PERSONE.DAT","FAMIGLIE.DAT","FONTI.DAT","EVENTI.DAT","CASATI.DAT","RAMI.DAT","STEMMI.DAT","APPARTENENZE.DAT","ALLIANZE.DAT","TITOLI.DAT","CASATI_TITOLI.DAT","PERSONE_TITOLI.DAT","MATRIMONI_TITOLI.DAT")) {
  $count = if ($rows.ContainsKey($name)) { $rows[$name].Count } else { 0 }
  $report.Add("FILE|$name|RECORDS=$count")
}
$report.Add("ISSUES|COUNT=$($issues.Count)")
foreach ($i in $issues) { $report.Add($i) }

$enc = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllLines((Join-Path $OutDir "VALIDATION_REPORT.txt"), $report, $enc)

if ($missingAssets.Count -eq 0) {
  [IO.File]::WriteAllText((Join-Path $LogDir "missing_heraldry_assets.log"), "# NONE`n", $enc)
} else {
  [IO.File]::WriteAllLines((Join-Path $LogDir "missing_heraldry_assets.log"), $missingAssets, $enc)
}

if ($titleConflicts.Count -eq 0) {
  [IO.File]::WriteAllText((Join-Path $LogDir "titles_conflicts.log"), "# NONE`n", $enc)
} else {
  [IO.File]::WriteAllLines((Join-Path $LogDir "titles_conflicts.log"), $titleConflicts, $enc)
}

if ($marriageTitleConflicts.Count -eq 0) {
  [IO.File]::WriteAllText((Join-Path $LogDir "marriage_title_inconsistencies.log"), "# NONE`n", $enc)
} else {
  [IO.File]::WriteAllLines((Join-Path $LogDir "marriage_title_inconsistencies.log"), $marriageTitleConflicts, $enc)
}

$report | Select-Object -First 12 | ForEach-Object { Write-Output $_ }
if ($missingAssets.Count -gt 0) {
  Write-Output "WARN|MISSING_HERALDRY_ASSETS=$($missingAssets.Count)"
}
if ($issues.Count -gt 0) {
  exit 1
}
