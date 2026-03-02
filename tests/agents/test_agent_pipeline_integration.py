"""Phase 4 final integration test: IMPORT -> NORMALIZE -> VALIDATE -> JOURNAL."""

import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.agents.pipeline_runner import AgentPipeline

DB = ROOT / 'tests' / 'agents' / '_tmp_agent_pipeline.sqlite'
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

pipeline = AgentPipeline(DB, MIGRATIONS)

sample = "\n".join(
    [
        '0 @I1@ INDI',
        '1 NAME Mario /Rossi/',
        '1 SEX M',
        '1 BIRT 1950',
        '0 @I2@ INDI',
        '1 NAME Maria /Rosi/',
        '1 SEX F',
        '1 BIRT 1955',
        '0 @F1@ FAM',
        '1 HUSB @I1@',
        '1 WIFE @I2@',
    ]
)

res = pipeline.import_gedcom(sample, 'sample.ged', session_id='sess-agent-1', source_id='S-AGT-1')
assert_true(res['parse_completed'] == 1, 'expected parse_completed=1')
assert_true(res['norm_completed'] == 1, 'expected norm_completed=1')
assert_true(res['replay']['entries'] > 0, 'expected journal entries > 0')
assert_true(res['replay']['chain_valid'] is True, 'expected valid hash chain')

# Journal should contain agent writes for PARSE, NORM, VALID
conn = sqlite3.connect(DB)
agents = {
    r[0]
    for r in conn.execute(
        "SELECT DISTINCT agent_id FROM event_journal WHERE session_id='sess-agent-1'"
    ).fetchall()
}
assert_true('PARSE_AGT' in agents, 'missing PARSE_AGT in journal')
assert_true('NORM_AGT' in agents, 'missing NORM_AGT in journal')
assert_true('VALID_AGT' in agents, 'missing VALID_AGT in journal')

persons = conn.execute("SELECT COUNT(*) FROM person").fetchone()[0]
assert_true(persons >= 2, 'expected at least 2 persons persisted')

# Trigger conflict generation from norm conflict channel
ambiguous = "\n".join(
    [
        '0 @I10@ INDI',
        '1 NAME Giovanni /Giardina/',
        '1 SEX M',
        '0 @I11@ INDI',
        '1 NAME Giovana /Giardena/',
        '1 SEX F',
    ]
)
pipeline.import_gedcom(ambiguous, 'ambiguous.ged', session_id='sess-agent-2', source_id='S-AGT-2')
cf_count = conn.execute("SELECT COUNT(*) FROM conflict_log WHERE status='OPEN'").fetchone()[0]
assert_true(cf_count >= 1, 'expected open conflicts from norm/valid pipeline')

conn.close()
ex = pipeline.explain_last()
assert_true(len(ex.get('trace', [])) >= 1, 'expected explain trace')

print('agent pipeline integration test: OK')
DB.unlink(missing_ok=True)