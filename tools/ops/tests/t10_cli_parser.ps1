param(
    [string]$DatasetPath,
    [string]$PagesUrl
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot/../lib/assert.ps1"

Write-Host "GN370 TEST t10_cli_parser"

$py = @'
from tools.agents.cli_parser import CommandParser, ParseError
p = CommandParser()

c1 = p.parse('feed /last 10')
assert c1.verb == 'feed'
assert str(c1.options.get('last')) == '10'

c2 = p.parse('open person "P#d26813cde2e7f17f"')
assert c2.verb == 'open'
assert c2.args[0] == 'person'
assert c2.args[1] == 'P#d26813cde2e7f17f'

c3 = p.parse('h')
assert c3.verb == 'help'
assert c3.alias_used == 'h'

try:
    p.parse('??? bad command')
    raise AssertionError('unknown verb should fail')
except ParseError as e:
    assert e.code == 'UNKNOWN_VERB'

print('ok')
'@

$out = $py | python -
Assert-Equal 0 $LASTEXITCODE "cli parser python execution"
Assert-Match $out "ok" "cli parser assertions"
exit 0

