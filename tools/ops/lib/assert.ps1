Set-StrictMode -Version Latest

function Write-Ok {
    param([string]$Message)
    Write-Host "(OK) $Message"
}

function Write-Warn {
    param([string]$Message)
    Write-Host "(WRN) $Message"
}

function Write-Err {
    param([string]$Message)
    Write-Host "(ERR) $Message"
}

function Fail-Assert {
    param([string]$Message)
    Write-Err $Message
    exit 2
}

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message = "Assert-True failed"
    )
    if (-not $Condition) {
        Fail-Assert $Message
    }
    Write-Ok $Message
}

function Assert-Equal {
    param(
        $Expected,
        $Actual,
        [string]$Message = "Assert-Equal failed"
    )
    if ($Expected -ne $Actual) {
        Fail-Assert "$Message (expected='$Expected' actual='$Actual')"
    }
    Write-Ok $Message
}

function Assert-Match {
    param(
        [string]$Value,
        [string]$Regex,
        [string]$Message = "Assert-Match failed"
    )
    if ($Value -notmatch $Regex) {
        Fail-Assert "$Message (value='$Value' regex='$Regex')"
    }
    Write-Ok $Message
}

function Assert-FileExists {
    param(
        [string]$Path,
        [string]$Message = "File not found"
    )
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        Fail-Assert "${Message}: $Path"
    }
    Write-Ok "${Message}: $Path"
}

function Assert-Http200 {
    param(
        [string]$Url,
        [string]$Message = "HTTP 200 expected"
    )
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -MaximumRedirection 5 -UseBasicParsing -ErrorAction Stop
    } catch {
        Fail-Assert "$Message for $Url ($($_.Exception.Message))"
    }
    if ([int]$response.StatusCode -ne 200) {
        Fail-Assert "$Message for $Url (status=$($response.StatusCode))"
    }
    Write-Ok "${Message}: $Url"
    return $response
}
