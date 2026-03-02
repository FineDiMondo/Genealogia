Set-StrictMode -Version Latest

function Safe-JoinPath {
    param(
        [Parameter(Mandatory = $true)][string]$BasePath,
        [Parameter(Mandatory = $true)][string[]]$Parts
    )
    $current = $BasePath
    foreach ($p in $Parts) {
        $current = Join-Path -Path $current -ChildPath $p
    }
    return $current
}

function Read-JsonFile {
    param([Parameter(Mandatory = $true)][string]$Path)
    $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    return ($raw | ConvertFrom-Json)
}

function Read-NdjsonFile {
    param([Parameter(Mandatory = $true)][string]$Path)
    $items = @()
    $lineNo = 0
    foreach ($line in (Get-Content -LiteralPath $Path -Encoding UTF8)) {
        $lineNo += 1
        $trim = $line.Trim()
        if ([string]::IsNullOrWhiteSpace($trim)) { continue }
        try {
            $items += ($trim | ConvertFrom-Json)
        } catch {
            throw "NDJSON parse error at line $lineNo in ${Path}: $($_.Exception.Message)"
        }
    }
    return [pscustomobject]@{
        Path  = $Path
        Count = $items.Count
        Items = $items
    }
}
