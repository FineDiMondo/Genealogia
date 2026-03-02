Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$DataDir = Join-Path $RootDir "data"
$ImportDir = Join-Path $DataDir "import"
$RawDir = Join-Path $ImportDir "raw"
$LogDir = Join-Path $RootDir "logs"
$ArDir = Join-Path $DataDir "araldica"
$SqliteExe = Join-Path $RootDir "tools\sqlite\sqlite3.exe"

$InputFile = Join-Path $DataDir "GEDCOM-FT-20260301.rmtree"
if ($args.Count -gt 0 -and $args[0]) {
  $InputFile = $args[0]
}

if (-not (Test-Path $InputFile)) {
  throw "File input non trovato: $InputFile"
}
if (-not (Test-Path $SqliteExe)) {
  throw "sqlite3.exe non trovato: $SqliteExe"
}

New-Item -ItemType Directory -Force -Path $ImportDir, $RawDir, $LogDir, $ArDir | Out-Null
Copy-Item -Force $InputFile (Join-Path $RawDir "latest.ged")

function Invoke-Sql {
  param([string]$Query)
  & $SqliteExe -separator "|" $InputFile $Query
}

function Normalize-Date {
  param([string]$Raw)
  if ([string]::IsNullOrWhiteSpace($Raw)) { return "" }
  $v = $Raw.Trim()
  $m = [regex]::Match($v, "([12]\d{3})(\d{2})(\d{2})")
  if ($m.Success) {
    $y = $m.Groups[1].Value
    $mo = $m.Groups[2].Value
    $d = $m.Groups[3].Value
    if ($mo -eq "00" -and $d -eq "00") { return $y }
    if ($d -eq "00") { return "$y-$mo" }
    return "$y-$mo-$d"
  }
  $m2 = [regex]::Match($v, "([12]\d{3})(\d{2})")
  if ($m2.Success) {
    $y = $m2.Groups[1].Value
    $mo = $m2.Groups[2].Value
    if ($mo -eq "00") { return $y }
    return "$y-$mo"
  }
  $m3 = [regex]::Match($v, "([12]\d{3})")
  if ($m3.Success) { return $m3.Groups[1].Value }
  return ""
}

function Sanitize {
  param([string]$Val)
  if ($null -eq $Val) { return "" }
  return (($Val -replace "\|", "/").Trim() -replace "\s+", " ")
}

function Write-Utf8NoBom {
  param(
    [string]$Path,
    [string[]]$Lines
  )
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllLines($Path, $Lines, $enc)
}

$mapFile = Join-Path $ImportDir "GEDMAP.DAT"
$existingMap = @{}
if (Test-Path $mapFile) {
  foreach ($line in Get-Content $mapFile -Encoding UTF8) {
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) { continue }
    $p = $line.Split("|")
    if ($p.Count -ne 3) { continue }
    $existingMap["$($p[0])|$($p[1])"] = $p[2]
  }
}

$nextP = 1
$nextF = 1
foreach ($v in $existingMap.Values) {
  if ($v -match "^P(\d{6})$") {
    $n = [int]$Matches[1]
    if ($n -ge $nextP) { $nextP = $n + 1 }
  }
  if ($v -match "^F(\d{6})$") {
    $n = [int]$Matches[1]
    if ($n -ge $nextF) { $nextF = $n + 1 }
  }
}

function Get-OrCreateId {
  param(
    [string]$Type,
    [string]$RawId
  )
  $k = "$Type|$RawId"
  if ($existingMap.ContainsKey($k)) {
    return $existingMap[$k]
  }
  if ($Type -eq "PERSONA") {
    $id = "P{0:D6}" -f $nextP
    $script:nextP++
  } else {
    $id = "F{0:D6}" -f $nextF
    $script:nextF++
  }
  $existingMap[$k] = $id
  return $id
}

$personRows = Invoke-Sql "select PersonID,UniqueID,Sex from PersonTable order by PersonID;"
$familyRows = Invoke-Sql "select FamilyID,FatherID,MotherID from FamilyTable order by FamilyID;"
$nameRows = Invoke-Sql "select OwnerID,Surname,Given from NameTable where IsPrimary=1 order by OwnerID;"
$placeRows = Invoke-Sql "select PlaceID,Name from PlaceTable;"
$childRows = Invoke-Sql "select FamilyID,ChildID,ChildOrder from ChildTable order by FamilyID,ChildOrder;"
$eventRows = Invoke-Sql "select EventID,EventType,OwnerType,OwnerID,FamilyID,PlaceID,Date from EventTable where EventType in (1,2,300) order by EventID;"

$names = @{}
foreach ($line in $nameRows) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $p = $line.Split("|")
  if ($p.Count -lt 3) { continue }
  $personNum = [int]$p[0]
  $names[$personNum] = @{
    Surname = (Sanitize $p[1]).ToUpperInvariant()
    Given   = (Sanitize $p[2])
  }
}

$places = @{}
foreach ($line in $placeRows) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $p = $line.Split("|")
  if ($p.Count -lt 2) { continue }
  $places[[int]$p[0]] = Sanitize ($p[1])
}

$childrenByFamily = @{}
$originFamilyByPerson = @{}
foreach ($line in $childRows) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $p = $line.Split("|")
  if ($p.Count -lt 2) { continue }
  $fid = [int]$p[0]
  $cid = [int]$p[1]
  if (-not $childrenByFamily.ContainsKey($fid)) { $childrenByFamily[$fid] = New-Object System.Collections.Generic.List[int] }
  $childrenByFamily[$fid].Add($cid)
  if (-not $originFamilyByPerson.ContainsKey($cid)) {
    $originFamilyByPerson[$cid] = $fid
  }
}

$mainFamilyByPerson = @{}
foreach ($line in $familyRows) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $p = $line.Split("|")
  if ($p.Count -lt 3) { continue }
  $fid = [int]$p[0]
  $dad = [int]$p[1]
  $mom = [int]$p[2]
  if ($dad -gt 0 -and -not $mainFamilyByPerson.ContainsKey($dad)) { $mainFamilyByPerson[$dad] = $fid }
  if ($mom -gt 0 -and -not $mainFamilyByPerson.ContainsKey($mom)) { $mainFamilyByPerson[$mom] = $fid }
}

$birthByPerson = @{}
$deathByPerson = @{}
$marrByFamily = @{}
$eventOut = New-Object System.Collections.Generic.List[string]
$evCounter = 1
foreach ($line in $eventRows) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $p = $line.Split("|")
  if ($p.Count -lt 7) { continue }
  $etype = [int]$p[1]
  $ownerId = [int]$p[3]
  $famId = [int]$p[4]
  $placeId = if ($p[5]) { [int]$p[5] } else { 0 }
  $dIso = Normalize-Date $p[6]
  $place = if ($places.ContainsKey($placeId)) { $places[$placeId] } else { "" }

  $eId = "E{0:D6}" -f $evCounter
  $evCounter++

  if ($etype -eq 1) {
    if (-not $birthByPerson.ContainsKey($ownerId)) {
      $birthByPerson[$ownerId] = @{ Date = $dIso; Place = $place }
    }
    $pidRef = if ($ownerId -gt 0) { Get-OrCreateId "PERSONA" ("I{0}" -f $ownerId) } else { "" }
    $eventOut.Add("$eId|BIRT|$dIso|$place|$pidRef||S000001|IMPORT_RMTREE")
  } elseif ($etype -eq 2) {
    if (-not $deathByPerson.ContainsKey($ownerId)) {
      $deathByPerson[$ownerId] = @{ Date = $dIso; Place = $place }
    }
    $pidRef = if ($ownerId -gt 0) { Get-OrCreateId "PERSONA" ("I{0}" -f $ownerId) } else { "" }
    $eventOut.Add("$eId|DEAT|$dIso|$place|$pidRef||S000001|IMPORT_RMTREE")
  } elseif ($etype -eq 300) {
    $fRefRaw = if ($famId -gt 0) { $famId } elseif ($ownerId -gt 0) { $ownerId } else { 0 }
    if ($fRefRaw -gt 0 -and -not $marrByFamily.ContainsKey($fRefRaw)) {
      $marrByFamily[$fRefRaw] = @{ Date = $dIso; Place = $place }
    }
    $fRef = if ($fRefRaw -gt 0) { Get-OrCreateId "FAMIGLIA" ("F{0}" -f $fRefRaw) } else { "" }
    $eventOut.Add("$eId|MARR|$dIso|$place||$fRef|S000001|IMPORT_RMTREE")
  }
}

foreach ($line in $personRows) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $p = $line.Split("|")
  if ($p.Count -lt 1) { continue }
  $pidRaw = [int]$p[0]
  [void](Get-OrCreateId "PERSONA" ("I{0}" -f $pidRaw))
}
foreach ($line in $familyRows) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $p = $line.Split("|")
  if ($p.Count -lt 1) { continue }
  $fidRaw = [int]$p[0]
  [void](Get-OrCreateId "FAMIGLIA" ("F{0}" -f $fidRaw))
}

$mapLines = @(
  "# GEDMAP.DAT",
  "# TIPO|GED_ORIGIN_ID|SEQ_ID"
)
$mapKeys = $existingMap.Keys | Sort-Object
foreach ($k in $mapKeys) {
  $parts = $k.Split("|")
  $mapLines += "$($parts[0])|$($parts[1])|$($existingMap[$k])"
}
Write-Utf8NoBom -Path $mapFile -Lines $mapLines

$today = Get-Date -Format "yyyy-MM-dd"
$fontiLines = @(
  "# FONTI.DAT",
  "# ID|TIPO|TITOLO|DATA_DOCUMENTO|ARCHIVIO|RIFERIMENTO|URL|NOTE",
  "S000001|RMTREE|IMPORT ROOTSMAGIC DATABASE|$today|data/import/raw|latest.ged||IMPORT_AUTOMATICO"
)
Write-Utf8NoBom -Path (Join-Path $DataDir "FONTI.DAT") -Lines $fontiLines

$personeLines = @(
  "# PERSONE.DAT",
  "# ID|GEDCOM_ID|COGNOME|NOME|SESSO|DATA_NASCITA|LUOGO_NASCITA|DATA_MORTE|LUOGO_MORTE|FAMIGLIA_ORIGINE|FAMIGLIA_PRINCIPALE|ID_FONTI|NOTE"
)
$dupIx = @{}
foreach ($line in $personRows) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $p = $line.Split("|")
  if ($p.Count -lt 3) { continue }
  $pidRaw = [int]$p[0]
  $uid = Sanitize $p[1]
  $sexRaw = [int]$p[2]
  $sex = if ($sexRaw -eq 0) { "M" } elseif ($sexRaw -eq 1) { "F" } else { "U" }

  $seq = Get-OrCreateId "PERSONA" ("I{0}" -f $pidRaw)
  $name = if ($names.ContainsKey($pidRaw)) { $names[$pidRaw] } else { @{ Surname = "SCONOSCIUTO"; Given = ("PERSONA {0}" -f $pidRaw) } }
  $b = if ($birthByPerson.ContainsKey($pidRaw)) { $birthByPerson[$pidRaw] } else { @{ Date = ""; Place = "" } }
  $d = if ($deathByPerson.ContainsKey($pidRaw)) { $deathByPerson[$pidRaw] } else { @{ Date = ""; Place = "" } }
  $famOrig = if ($originFamilyByPerson.ContainsKey($pidRaw)) { Get-OrCreateId "FAMIGLIA" ("F{0}" -f $originFamilyByPerson[$pidRaw]) } else { "" }
  $famMain = if ($mainFamilyByPerson.ContainsKey($pidRaw)) { Get-OrCreateId "FAMIGLIA" ("F{0}" -f $mainFamilyByPerson[$pidRaw]) } else { "" }

  $personeLines += "$seq|$uid|$($name.Surname)|$($name.Given)|$sex|$($b.Date)|$($b.Place)|$($d.Date)|$($d.Place)|$famOrig|$famMain|S000001|IMPORT_RMTREE"

  $dk = "$($name.Surname)|$($name.Given.ToUpperInvariant())|$($b.Date)"
  if (-not $dupIx.ContainsKey($dk)) { $dupIx[$dk] = New-Object System.Collections.Generic.List[string] }
  $dupIx[$dk].Add($seq)
}
Write-Utf8NoBom -Path (Join-Path $DataDir "PERSONE.DAT") -Lines $personeLines

$dupLines = @()
foreach ($k in $dupIx.Keys) {
  if ($dupIx[$k].Count -gt 1) {
    $p = $k.Split("|")
    $dupLines += "DUP|$($p[0])|$($p[1])|$($p[2])|IDS=$([string]::Join(',', $dupIx[$k]))"
  }
}
if ($dupLines.Count -eq 0) { $dupLines = @("# NO DUPLICATES DETECTED") }
Write-Utf8NoBom -Path (Join-Path $LogDir "duplicates.log") -Lines $dupLines

$famLines = @(
  "# FAMIGLIE.DAT",
  "# ID|GEDCOM_ID|COGNOME_FAMIGLIA|ID_HUSB|ID_WIFE|ID_FIGLI|DATA_MATRIMONIO|LUOGO_MATRIMONIO|ID_FONTI|NOTE"
)
foreach ($line in $familyRows) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $p = $line.Split("|")
  if ($p.Count -lt 3) { continue }
  $fidRaw = [int]$p[0]
  $dadRaw = [int]$p[1]
  $momRaw = [int]$p[2]
  $fid = Get-OrCreateId "FAMIGLIA" ("F{0}" -f $fidRaw)
  $dad = if ($dadRaw -gt 0) { Get-OrCreateId "PERSONA" ("I{0}" -f $dadRaw) } else { "" }
  $mom = if ($momRaw -gt 0) { Get-OrCreateId "PERSONA" ("I{0}" -f $momRaw) } else { "" }
  $childIds = @()
  if ($childrenByFamily.ContainsKey($fidRaw)) {
    foreach ($c in $childrenByFamily[$fidRaw]) {
      $childIds += Get-OrCreateId "PERSONA" ("I{0}" -f $c)
    }
  }
  $m = if ($marrByFamily.ContainsKey($fidRaw)) { $marrByFamily[$fidRaw] } else { @{ Date = ""; Place = "" } }
  $surname = ""
  if ($dadRaw -gt 0 -and $names.ContainsKey($dadRaw)) { $surname = $names[$dadRaw].Surname }
  elseif ($momRaw -gt 0 -and $names.ContainsKey($momRaw)) { $surname = $names[$momRaw].Surname }
  $famLines += "$fid|F$fidRaw|$surname|$dad|$mom|$([string]::Join(',', $childIds))|$($m.Date)|$($m.Place)|S000001|IMPORT_RMTREE"
}
Write-Utf8NoBom -Path (Join-Path $DataDir "FAMIGLIE.DAT") -Lines $famLines

$eventLines = @(
  "# EVENTI.DAT",
  "# ID|TIPO|DATA|LUOGO|ID_PERSONA|ID_FAMIGLIA|ID_FONTE|NOTE"
) + $eventOut
Write-Utf8NoBom -Path (Join-Path $DataDir "EVENTI.DAT") -Lines $eventLines

$casatiFile = Join-Path $ArDir "CASATI.DAT"
$ramiFile = Join-Path $ArDir "RAMI.DAT"
$stemmiFile = Join-Path $ArDir "STEMMI.DAT"
$appFile = Join-Path $ArDir "APPARTENENZE.DAT"
$allFile = Join-Path $ArDir "ALLIANZE.DAT"

if (-not (Test-Path $casatiFile)) {
  Write-Utf8NoBom -Path $casatiFile -Lines @(
    "# CASATI.DAT",
    "# ID|NOME|TERRITORIO|DAL|AL|NOTE|ID_FONTE",
    "C000001|GIARDINA|SICILIA|1700||CASATO PRINCIPALE|S000001",
    "C000002|NEGRINI|SICILIA|1750||CASATO COLLEGATO|S000001"
  )
}
if (-not (Test-Path $ramiFile)) {
  Write-Utf8NoBom -Path $ramiFile -Lines @(
    "# RAMI.DAT",
    "# ID|ID_CASATO|NOME_RAMO|DAL|AL|NOTE",
    "R000001|C000001|PRINCIPALE|1900||RAMO MODERNO",
    "R000002|C000002|PALERMO|1900||RAMO PALERMITANO"
  )
}
if (-not (Test-Path $stemmiFile)) {
  Write-Utf8NoBom -Path $stemmiFile -Lines @(
    "# STEMMI.DAT",
    "# ID|ID_CASATO|ID_RAMO|TIPO|BLAZONE|IMG_PATH|DAL|AL|PRIORITA|ID_FONTE|NOTE",
    "H000001|C000001||ARMIGERIA_BASE|D'AZZURRO AL LEONE D'ORO|assets/heraldry/giardina_base.png|1700||10|S000001|BASE CASATO",
    "H000002|C000001|R000001|VARIANTE_RAMO|D'AZZURRO CON BANDA D'ARGENTO|assets/heraldry/giardina_ramo_principale.png|1900||50|S000001|RAMO PRINCIPALE",
    "H000003|C000002||ARMIGERIA_BASE|D'ARGENTO ALLA CROCE ROSSA|assets/heraldry/negrini_base.png|1750||10|S000001|BASE CASATO",
    "H000004|C000002|R000002|VARIANTE_RAMO|D'ARGENTO CON CAPO D'AZZURRO|assets/heraldry/negrini_palermo.png|1900||60|S000001|RAMO PALERMO"
  )
}

$appLines = @(
  "# APPARTENENZE.DAT",
  "# ID|ID_PERSONA|ID_CASATO|ID_RAMO|TITOLO|DAL|AL|NOTE"
)
$idxApp = 1
foreach ($line in $personeLines) {
  if ($line.StartsWith("#")) { continue }
  $p = $line.Split("|")
  if ($p.Count -lt 6) { continue }
  $personId = $p[0]
  $surname = $p[2]
  $birth = $p[5]
  $dal = if ($birth -match "^\d{4}") { $birth.Substring(0,4) } else { "" }
  if ($surname -eq "GIARDINA") {
    $appLines += ("A{0:D6}|{1}|C000001|R000001|DISCENDENZA|{2}||AUTO_IMPORT" -f $idxApp, $personId, $dal)
    $idxApp++
  } elseif ($surname -eq "NEGRINI") {
    $appLines += ("A{0:D6}|{1}|C000002|R000002|DISCENDENZA|{2}||AUTO_IMPORT" -f $idxApp, $personId, $dal)
    $idxApp++
  }
}
Write-Utf8NoBom -Path $appFile -Lines $appLines

if (-not (Test-Path $allFile)) {
  Write-Utf8NoBom -Path $allFile -Lines @(
    "# ALLIANZE.DAT",
    "# ID|ID_CASATO_A|ID_CASATO_B|DAL|AL|TIPO|ID_FONTE"
  )
}

Write-Output ("UPDATED|PEOPLE={0}|FAMILIES={1}|EVENTS={2}" -f ($personeLines.Count - 2), ($famLines.Count - 2), ($eventOut.Count))
