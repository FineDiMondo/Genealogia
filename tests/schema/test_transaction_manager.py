import sqlite3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.db.transaction_manager import TransactionManager

DB = ROOT / 'tests' / 'schema' / '_tmp_transaction_manager.sqlite'
MIGRATIONS = [
    ROOT / 'tools' / 'db' / 'migrations' / '001_gn370_next_core.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '002_domain_schema.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '002_seed_lexicon.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '002_indexes.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '003_integrity_triggers.sql',
]


def assert_eq(actual, expected, msg):
    if actual != expected:
        raise SystemExit(f'{msg}: expected={expected!r} actual={actual!r}')


def seed_source(db_path):
    conn = sqlite3.connect(db_path)
    conn.execute('PRAGMA foreign_keys = ON;')
    conn.execute(
        "INSERT INTO source(source_id, source_type, title) VALUES ('S-1', 'GEDCOM', 'Source 1')"
    )
    conn.commit()
    conn.close()


class BrokenHashTM(TransactionManager):
    def _compute_entry_hash(self, prev_hash: str, payload_json: str) -> str:
        return 'x' * 64


if DB.exists():
    DB.unlink()

# Build DB and apply migrations
manager = TransactionManager(DB, MIGRATIONS)
manager.apply_migrations()
seed_source(DB)

# 1) write() happy path
res1 = manager.write(
    entity_type='PERSON',
    entity_id='GN-TM-0001',
    operation='person.upsert',
    payload={
        'sex': 'M',
        'reliability': 'V',
        'source_id': 'S-1',
        'hash_state': 'state-v1',
        'state': {'hash_state': 'state-v1'},
    },
    agent_id='PARSE_AGT',
    session_id='sess-tm-1',
    user_cmd='IMPORT TEST',
)
assert_eq(res1['status'], 'written', 'first write status')
assert res1['journal_id'] > 0

# 2) idempotency: same write should not duplicate journal entry
res_dup = manager.write(
    entity_type='PERSON',
    entity_id='GN-TM-0001',
    operation='person.upsert',
    payload={
        'sex': 'M',
        'reliability': 'V',
        'source_id': 'S-1',
        'hash_state': 'state-v1',
        'state': {'hash_state': 'state-v1'},
    },
    agent_id='PARSE_AGT',
    session_id='sess-tm-1',
    user_cmd='IMPORT TEST',
)
assert_eq(res_dup['status'], 'duplicate', 'duplicate write status')
assert_eq(res_dup['journal_id'], res1['journal_id'], 'duplicate journal id reuse')

conn = sqlite3.connect(DB)
j_count = conn.execute('SELECT COUNT(*) FROM event_journal').fetchone()[0]
assert_eq(j_count, 1, 'journal row count after duplicate')
conn.close()

# 3) second valid write + replay determinism
res2 = manager.write(
    entity_type='PERSON',
    entity_id='GN-TM-0001',
    operation='person.upsert',
    payload={
        'sex': 'M',
        'reliability': 'V',
        'source_id': 'S-1',
        'hash_state': 'state-v2',
        'state': {'hash_state': 'state-v2'},
    },
    agent_id='NORM_AGT',
    session_id='sess-tm-1',
    user_cmd='NORMALIZE TEST',
)
assert_eq(res2['status'], 'written', 'second write status')

replay1 = manager.replay('sess-tm-1')
replay2 = manager.replay('sess-tm-1')
assert_eq(replay1['entries'], 2, 'replay entries count')
assert_eq(replay1['chain_valid'], True, 'replay chain valid')
assert_eq(replay1, replay2, 'replay deterministic output')
assert_eq(
    replay1['state']['PERSON:GN-TM-0001']['hash_state'],
    'state-v2',
    'replay final state value',
)

# 4) rollback atomico: mutation must rollback if journal insert fails
broken = BrokenHashTM(DB, MIGRATIONS)
try:
    broken.write(
        entity_type='PERSON',
        entity_id='GN-TM-ROLLBACK',
        operation='person.upsert',
        payload={
            'sex': 'F',
            'reliability': 'V',
            'source_id': 'S-1',
            'hash_state': 'should-rollback',
            'state': {'hash_state': 'should-rollback'},
        },
        agent_id='VALID_AGT',
        session_id='sess-tm-2',
        user_cmd='ROLLBACK TEST',
    )
    raise SystemExit('Expected journal hash failure was not raised')
except sqlite3.IntegrityError:
    pass

conn = sqlite3.connect(DB)
exists = conn.execute(
    "SELECT COUNT(*) FROM person WHERE person_id='GN-TM-ROLLBACK'"
).fetchone()[0]
assert_eq(exists, 0, 'rollback removed mutation')
conn.close()

# 5) invariant smoke check: connection without sha256 cannot write journal
plain = sqlite3.connect(DB)
plain.execute('PRAGMA foreign_keys = ON;')
try:
    plain.execute(
        """
        INSERT INTO event_journal(
          agent_id, event_class, entity_type, entity_id,
          payload, session_id, user_cmd, prev_hash, entry_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            'EXPL_AGT',
            'PERSON_UPDATED',
            'PERSON',
            'GN-TM-0001',
            '{}',
            'sess-tm-3',
            'MANUAL',
            '0' * 64,
            '0' * 64,
        ),
    )
    plain.commit()
    raise SystemExit('Expected missing sha256 function error was not raised')
except sqlite3.OperationalError:
    plain.rollback()
finally:
    plain.close()

print('transaction manager tests: OK')
DB.unlink(missing_ok=True)
