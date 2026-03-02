import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.agents.shell_runner import ShellSession

DB = ROOT / 'tests' / 'agents' / '_tmp_shell_runner.sqlite'
MIGRATIONS = [
    ROOT / 'tools' / 'db' / 'migrations' / '001_gn370_next_core.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '002_domain_schema.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '002_seed_lexicon.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '002_indexes.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '003_integrity_triggers.sql',
]


def assert_true(cond, msg):
    if not cond:
        raise SystemExit(msg)


if DB.exists():
    DB.unlink()

shell = ShellSession(DB, MIGRATIONS)

r1 = shell.run('help')
assert_true(r1['ok'] is True, 'help should succeed')
assert_true('GN370 HELP' in r1['output'], 'help output mismatch')

r2 = shell.run('job run pipeline')
assert_true(r2['ok'] is True, 'job run pipeline should succeed')
assert_true('pipeline run complete' in r2['output'], 'pipeline output mismatch')

r3 = shell.run('feed /last 10')
assert_true(r3['ok'] is True, 'feed should succeed')
assert_true('PARSE_AGT' in r3['output'] or 'NORM_AGT' in r3['output'] or 'VALID_AGT' in r3['output'], 'feed should show journal rows')

r4 = shell.run('open person GN-I1')
assert_true(r4['ok'] is True, 'open person should succeed')

r5 = shell.run('show card')
assert_true(r5['ok'] is True, 'show card should succeed')
assert_true('CARD PERSON' in r5['output'] or 'person not found' in r5['output'], 'show card output mismatch')

r6 = shell.run('explain')
assert_true(r6['ok'] is True, 'explain should succeed')
assert_true('EXPLAIN' in r6['output'] or 'no explain trace' in r6['output'].lower(), 'explain output mismatch')

r7 = shell.run('zzzz')
assert_true(r7['ok'] is False, 'invalid command should fail')
assert_true(len(r7['suggestions']) > 0, 'invalid command should return suggestions')

print('shell runner smoke tests: OK')
DB.unlink(missing_ok=True)