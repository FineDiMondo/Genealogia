param(
  [Parameter(Mandatory=$true)][string]$Op,
  [string]$Arg1,
  [string]$Arg2
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repo = (Resolve-Path "$PSScriptRoot\..\..").Path
Set-Location $repo

$lockFile = Join-Path $repo "data\.lock"
$currentDir = Join-Path $repo "data\current"
$backupsDir = Join-Path $repo "data\backups"
$trashDir = Join-Path $repo "data\trash"

function Acquire-Lock {
  if (Test-Path $lockFile) {
    Write-Host "(ERR) DB BUSY - lock exists"
    exit 3
  }
  "locked:${Op}:$(Get-Date -Format o)" | Set-Content -Encoding UTF8 $lockFile
}

function Release-Lock {
  if (Test-Path $lockFile) { Remove-Item -Force $lockFile }
}

function Ensure-Dirs {
  New-Item -ItemType Directory -Force $backupsDir | Out-Null
  New-Item -ItemType Directory -Force $trashDir | Out-Null
}

function Get-VersionCommit7 {
  $vFile = Join-Path $repo "version.json"
  if (-not (Test-Path $vFile)) { return "dev" }
  try {
    $v = Get-Content $vFile -Raw | ConvertFrom-Json
    $c = [string]$v.commit
    if (-not $c) { return "dev" }
    return $c.Substring(0, [Math]::Min(7, $c.Length))
  } catch {
    return "dev"
  }
}

function Build-ManifestObj([string]$backupFile) {
  $files = Get-ChildItem -Recurse -File $currentDir | Sort-Object FullName
  $list = @()
  $persons = 0; $families = 0; $events = 0; $bytes = 0
  foreach ($f in $files) {
    $rel = $f.FullName.Substring($repo.Length + 1).Replace("\","/")
    $sha = (Get-FileHash -Algorithm SHA256 $f.FullName).Hash.ToLower()
    $bytes += $f.Length
    if ($rel -like "data/current/records/PERSON/*") { $persons++ }
    if ($rel -like "data/current/records/FAMILY/*") { $families++ }
    if ($rel -like "data/current/records/EVENT/*") { $events++ }
    $list += [ordered]@{ path = $rel; sha256 = $sha; size = $f.Length }
  }
  return [ordered]@{
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
    commit7 = (Get-VersionCommit7)
    backupFile = $backupFile.Replace("\","/")
    counts = [ordered]@{
      persons = $persons
      families = $families
      events = $events
      files = $files.Count
      bytes = $bytes
    }
    files = $list
  }
}

function Append-Event([string]$type,[string]$title) {
  $evFile = Join-Path $currentDir "events.ndjson"
  if (-not (Test-Path $evFile)) { New-Item -ItemType File -Path $evFile -Force | Out-Null }
  $e = [ordered]@{
    ts = (Get-Date).ToUniversalTime().ToString("o")
    type = $type
    entity = "db"
    id = "current"
    title = $title
    by = "db_ops.ps1"
    importance = "major"
  } | ConvertTo-Json -Compress
  Add-Content -Path $evFile -Value $e
}

function Write-DbStatus([string]$lastAction,[string]$latestBackup) {
  $metaDir = Join-Path $currentDir "meta"
  New-Item -ItemType Directory -Force $metaDir | Out-Null
  $statusPath = Join-Path $metaDir "db_status.json"
  $counts = [ordered]@{ persons = 0; families = 0; events = 0; files = 0; bytes = 0 }
  if (Test-Path $currentDir) {
    $files = @(Get-ChildItem -Recurse -File $currentDir)
    $counts.files = $files.Count
    foreach ($f in $files) { $counts.bytes += $f.Length }
    $counts.persons = @(Get-ChildItem -File (Join-Path $currentDir "records\PERSON") -ErrorAction SilentlyContinue).Count
    $counts.families = @(Get-ChildItem -File (Join-Path $currentDir "records\FAMILY") -ErrorAction SilentlyContinue).Count
    $counts.events = @(Get-ChildItem -File (Join-Path $currentDir "records\EVENT") -ErrorAction SilentlyContinue).Count
  }
  $obj = [ordered]@{
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
    lastAction = $lastAction
    latestBackup = $latestBackup
    counts = $counts
  }
  ($obj | ConvertTo-Json -Depth 6) | Set-Content -Encoding UTF8 $statusPath
}

function Run-Backup([string]$tag,[switch]$KeepAll,[switch]$NoLock,[switch]$NoRetention) {
  if (-not (Test-Path $currentDir)) {
    Write-Host "(ERR) data/current missing"
    return 2
  }

  Ensure-Dirs
  if (-not $NoLock) { Acquire-Lock }
  try {
    if (-not $tag) { $tag = "manual" }
    $safeTag = $tag.Replace(" ", "_")
    $ts = Get-Date -Format "yyyyMMdd_HHmmss"
    $base = "backup_${ts}_${safeTag}"
    $tmpZip = Join-Path $backupsDir "$base.tmp.zip"
    $outZip = Join-Path $backupsDir "$base.zip"
    $manifestPath = Join-Path $backupsDir "$base.manifest.json"

    if (Test-Path $tmpZip) { Remove-Item -Force $tmpZip }
    Compress-Archive -Path (Join-Path $currentDir "*") -DestinationPath $tmpZip -Force
    Move-Item -Force $tmpZip $outZip

    $manifest = Build-ManifestObj -backupFile ("data/backups/" + [IO.Path]::GetFileName($outZip))
    ($manifest | ConvertTo-Json -Depth 8) | Set-Content -Encoding UTF8 $manifestPath

    $warn = 0
    if (-not $KeepAll -and -not $NoRetention) {
      $all = @(Get-ChildItem $backupsDir -Filter "backup_*.zip" | Sort-Object LastWriteTime -Descending)
      if ($all.Count -gt 10) {
        $all[10..($all.Count-1)] | ForEach-Object {
          Remove-Item -Force $_.FullName -ErrorAction SilentlyContinue
          $m = Join-Path $_.DirectoryName ($_.BaseName + ".manifest.json")
          if (Test-Path $m) { Remove-Item -Force $m -ErrorAction SilentlyContinue }
        }
        $warn = 1
      }
    }
    Write-DbStatus -lastAction "backup" -latestBackup $outZip
    Append-Event -type "db.backup" -title "Database backup complete"
    Write-Host "(OK) backup created: $outZip"
    if ($warn -eq 1) { return 1 } else { return 0 }
  } finally {
    if (-not $NoLock) { Release-Lock }
  }
}

function Run-Reset([switch]$KeepBackup) {
  Acquire-Lock
  try {
    # nested backup without lock to avoid self deadlock
    $rc = Run-Backup -tag "pre_reset" -NoLock -NoRetention
    if ($rc -ge 3) {
      Write-Host "(ERR) pre-reset backup failed"
      return 3
    }
    $ts = Get-Date -Format "yyyyMMdd_HHmmss"
    Ensure-Dirs
    if (Test-Path $currentDir) {
      Move-Item -Force $currentDir (Join-Path $trashDir "current_$ts")
    }
    New-Item -ItemType Directory -Force (Join-Path $currentDir "entities"), (Join-Path $currentDir "indexes"), (Join-Path $currentDir "meta"), (Join-Path $currentDir "records") | Out-Null
    $resetMeta = [ordered]@{
      timestamp = (Get-Date).ToUniversalTime().ToString("o")
      reason = "manual"
      backupRef = "pre_reset"
      keepBackup = [bool]$KeepBackup
    }
    ($resetMeta | ConvertTo-Json -Depth 4) | Set-Content -Encoding UTF8 (Join-Path $currentDir "meta\last_reset.json")
    Write-DbStatus -lastAction "reset" -latestBackup ""
    Append-Event -type "db.reset" -title "Database reset complete"
    Write-Host "(OK) DB reset completed"
    return 0
  } finally {
    Release-Lock
  }
}

function Run-Rebuild {
  Acquire-Lock
  try {
    $rc = Run-Backup -tag "pre_rebuild" -NoLock -NoRetention
    if ($rc -ge 3) {
      Write-Host "(ERR) pre-rebuild backup failed"
      return 3
    }
    New-Item -ItemType Directory -Force (Join-Path $currentDir "entities"), (Join-Path $currentDir "indexes"), (Join-Path $currentDir "meta"), (Join-Path $currentDir "records") | Out-Null
    $manifestPath = Join-Path $currentDir "records\manifest.json"
    if (-not (Test-Path $manifestPath)) {
      $m = [ordered]@{ persons=@(); families=@(); events=@() }
      ($m | ConvertTo-Json -Depth 4) | Set-Content -Encoding UTF8 $manifestPath
    }
    if (-not (Test-Path $manifestPath)) {
      Write-Host "(ERR) rebuild validation failed: manifest missing"
      Write-Host "(WRN) use db_restore.cmd with latest backup"
      return 3
    }
    $meta = [ordered]@{
      timestamp = (Get-Date).ToUniversalTime().ToString("o")
      status = "ok"
      source = "db_rebuild.cmd"
    }
    ($meta | ConvertTo-Json -Depth 4) | Set-Content -Encoding UTF8 (Join-Path $currentDir "meta\last_rebuild.json")
    Write-DbStatus -lastAction "rebuild" -latestBackup ""
    Append-Event -type "db.rebuild" -title "DB rebuild complete"
    Write-Host "(OK) rebuild completed"
    return 0
  } finally {
    Release-Lock
  }
}

function Run-Restore([string]$zipPath) {
  if (-not $zipPath) {
    Write-Host "Usage: db_restore.cmd data\backups\backup_xxx.zip"
    exit 2
  }
  if (-not (Test-Path $zipPath)) {
    Write-Host "(ERR) backup not found: $zipPath"
    exit 2
  }

  Acquire-Lock
  try {
    $rc = Run-Backup -tag "pre_restore" -NoLock -NoRetention
    if ($rc -ge 3) {
      Write-Host "(ERR) pre-restore backup failed"
      return 3
    }
    Ensure-Dirs
    $ts = Get-Date -Format "yyyyMMdd_HHmmss"
    if (Test-Path $currentDir) {
      Move-Item -Force $currentDir (Join-Path $trashDir "current_$ts")
    }
    New-Item -ItemType Directory -Force $currentDir | Out-Null
    Expand-Archive -Path $zipPath -DestinationPath $currentDir -Force
    if (-not (Test-Path (Join-Path $currentDir "events.ndjson"))) {
      Write-Host "(ERR) core file missing after restore"
      return 3
    }
    Write-DbStatus -lastAction "restore" -latestBackup $zipPath
    Append-Event -type "db.restore" -title "Database restore complete"
    Write-Host "(OK) restore completed from $zipPath"
    return 0
  } finally {
    Release-Lock
  }
}

switch ($Op.ToLower()) {
  "backup" { exit (Run-Backup -tag $Arg1 -KeepAll:($Arg2 -eq "--keep-all")) }
  "reset" { exit (Run-Reset -KeepBackup:($Arg1 -eq "--keep-backup")) }
  "rebuild" { exit (Run-Rebuild) }
  "restore" { exit (Run-Restore -zipPath $Arg1) }
  default {
    Write-Host "Usage: db_ops.ps1 <backup|reset|rebuild|restore> [args]"
    exit 2
  }
}
