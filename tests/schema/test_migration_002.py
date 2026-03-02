import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS = [
    ROOT / 'tools' / 'db' / 'migrations' / '001_gn370_next_core.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '002_domain_schema.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '002_seed_lexicon.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '002_indexes.sql',
]
DB = ROOT / 'tests' / 'schema' / '_tmp_migration_002.sqlite'


def build_db():
    if DB.exists():
        DB.unlink()
    conn = sqlite3.connect(DB)
    conn.execute('PRAGMA foreign_keys = ON;')
    for migration in MIGRATIONS:
        conn.executescript(migration.read_text(encoding='utf-8'))
    return conn


def assert_table_exists(conn, name):
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (name,),
    ).fetchone()
    if not row:
        raise SystemExit(f'Missing table: {name}')


def assert_index_exists(conn, name):
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='index' AND name=?",
        (name,),
    ).fetchone()
    if not row:
        raise SystemExit(f'Missing index: {name}')


def expect_integrity_error(conn, sql, params):
    try:
        conn.execute(sql, params)
        conn.commit()
    except sqlite3.IntegrityError:
        conn.rollback()
        return
    raise SystemExit(f'Expected IntegrityError was not raised: {sql}')


conn = build_db()

# Table existence
for table in [
    'person',
    'person_name',
    'family',
    'family_member',
    'event',
    'event_type',
    'place',
    'title',
    'heraldic_arm',
    'source',
    'lexicon',
    'schema_version',
]:
    assert_table_exists(conn, table)

# Index existence
for idx in [
    'idx_pname_surname',
    'idx_pname_person',
    'idx_event_type',
    'idx_event_date',
    'idx_journal_entity',
    'idx_journal_agent',
    'idx_journal_sess',
    'idx_conflict_open',
]:
    assert_index_exists(conn, idx)

# Seed minimum checks
for domain, expected in {
    'RELIABILITY': 6,
    'AGENT_ID': 7,
    'EVENT_TYPE': 8,
    'COMMAND_VERB': 17,
}.items():
    count = conn.execute(
        'SELECT COUNT(*) FROM lexicon WHERE domain=?',
        (domain,),
    ).fetchone()[0]
    if count < expected:
        raise SystemExit(f'Lexicon domain {domain} count too low: {count} < {expected}')

# FK sanity data
conn.execute(
    "INSERT INTO source(source_id, source_type, title) VALUES ('S-000000001', 'GEDCOM', 'Fixture Source')"
)
conn.execute(
    "INSERT INTO person(person_id, sex, reliability, source_id, hash_state) VALUES ('GN-0000000001', 'M', 'V', 'S-000000001', 'h1')"
)
conn.execute(
    "INSERT INTO person(person_id, sex, reliability, source_id, hash_state) VALUES ('GN-0000000002', 'F', 'V', 'S-000000001', 'h2')"
)
conn.execute(
    "INSERT INTO family(family_id, partner_a_id, partner_b_id, union_type, reliability, source_id) VALUES ('GNF-000000001', 'GN-0000000001', 'GN-0000000002', 'MARRIAGE', 'V', 'S-000000001')"
)
conn.execute(
    "INSERT INTO event_type(event_type_id, code, subject_scope) VALUES (1, 'BIRTH', 'P')"
)
conn.commit()

# CHECK negative tests
expect_integrity_error(
    conn,
    "INSERT INTO person(person_id, sex, reliability, hash_state) VALUES (?, ?, ?, ?)",
    ('GN-0000000099', 'X', 'V', 'hx'),
)
expect_integrity_error(
    conn,
    "INSERT INTO person(person_id, sex, reliability, hash_state) VALUES (?, ?, ?, ?)",
    ('GN-0000000098', 'M', 'Z', 'hy'),
)
expect_integrity_error(
    conn,
    "INSERT INTO family(family_id, partner_a_id, partner_b_id, reliability) VALUES (?, ?, ?, ?)",
    ('GNF-000000099', 'GN-0000000001', 'GN-0000000001', 'V'),
)
expect_integrity_error(
    conn,
    "INSERT INTO family_member(family_id, person_id, role) VALUES (?, ?, ?)",
    ('GNF-000000001', 'GN-0000000001', 'INVALID_ROLE'),
)
expect_integrity_error(
    conn,
    "INSERT INTO event(event_id, event_type_id, subject_type, subject_id, reliability) VALUES (?, ?, ?, ?, ?)",
    ('GNE-000000001', 1, 'X', 'GN-0000000001', 'V'),
)

# FK negative tests
expect_integrity_error(
    conn,
    "INSERT INTO person_name(person_id, name_type, given_name) VALUES (?, ?, ?)",
    ('GN-DOES-NOT-EXIST', 'BIRTH', 'Mario'),
)
expect_integrity_error(
    conn,
    "INSERT INTO family_member(family_id, person_id, role) VALUES (?, ?, ?)",
    ('GNF-DOES-NOT-EXIST', 'GN-0000000001', 'CHILD'),
)

print('migration 002 schema test: OK')
conn.close()
DB.unlink(missing_ok=True)