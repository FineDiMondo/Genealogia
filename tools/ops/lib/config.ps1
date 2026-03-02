Set-StrictMode -Version Latest

function Get-RepoRoot {
    $opsLibDir = $PSScriptRoot
    return (Resolve-Path (Join-Path $opsLibDir "../../..")).Path
}

function DefaultDatasetPath {
    $root = Get-RepoRoot
    return (Join-Path $root "data/current")
}

function DefaultPagesUrl {
    return "https://finedimondo.github.io/Genealogia/"
}

function Get-PathConventions {
    param([string]$DatasetPath = (DefaultDatasetPath))
    return [ordered]@{
        DatasetRoot    = $DatasetPath
        JournalFile    = (Join-Path $DatasetPath "events.ndjson")
        PersonsFile    = (Join-Path $DatasetPath "entities/persons.ndjson")
        FamiliesFile   = (Join-Path $DatasetPath "entities/families.ndjson")
        SourcesFile    = (Join-Path $DatasetPath "entities/sources.ndjson")
        IndexNameFile  = (Join-Path $DatasetPath "indexes/person_name.idx")
        IndexFsidFile  = (Join-Path $DatasetPath "indexes/person_fs_id.idx")
        MetaDbStatus   = (Join-Path $DatasetPath "meta/db_status.json")
        MetaImport     = (Join-Path $DatasetPath "meta/last_import.json")
        MetaRebuild    = (Join-Path $DatasetPath "meta/last_rebuild.json")
        RecordsRoot    = (Join-Path $DatasetPath "records")
    }
}
