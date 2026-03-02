import hashlib
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB = ROOT / 'tests' / 'schema' / '_tmp_integrity_triggers.sqlite'
MIGRATIONS = [
    ROOT / 'tools' / 'db' / 'migrations' / '001_gn370_next_core.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '002_domain_schema.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '002_seed_lexicon.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '002_indexes.sql',
    ROOT / 'tools' / 'db' / 'migrations' / '003_integrity_triggers.sql',
]


def sha256_hex(text):
    if text is None:
        text = ''
    return hashlib.sha256(str(text).encode('utf-8')).hexdigest()


def build_db():
    if DB.exists():
        DB.unlink()
    conn = sqlite3.connect(DB)
    conn.execute('PRAGMA foreign_keys = ON;')
    conn.create_function('sha256', 1, sha256_hex)
    for migration in MIGRATIONS:
        conn.executescript(migration.read_text(encoding='utf-8'))
    return conn


def expect_integrity_error(conn, sql, params=()):
    try:
        conn.execute(sql, params)
        conn.commit()
    except sqlite3.IntegrityError:
        conn.rollback()
        return
    raise SystemExit(f'Expected IntegrityError was not raised: {sql}')


def setup_base(conn):
    conn.execute("INSERT INTO source(source_id, source_type, title) VALUES ('S-1', 'GEDCOM', 'Source 1')")
    conn.execute("INSERT INTO person(person_id, sex, reliability, source_id, hash_state) VALUES ('GN-P1', 'M', 'V', 'S-1', 'h1')")
    conn.execute("INSERT INTO person(person_id, sex, reliability, source_id, hash_state) VALUES ('GN-P2', 'F', 'V', 'S-1', 'h2')")
    conn.execute(
        "INSERT INTO family(family_id, partner_a_id, partner_b_id, union_type, reliability, source_id) "
        "VALUES ('GN-F1', 'GN-P1', 'GN-P2', 'MARRIAGE', 'V', 'S-1')"
    )
    conn.execute("INSERT INTO event_type(event_type_id, code, subject_scope) VALUES (1, 'BIRTH', 'P')")
    conn.commit()


conn = build_db()
setup_base(conn)

# 1) Polymorphic trigger: event.subject_id
conn.execute(
    "INSERT INTO event(event_id, event_type_id, subject_type, subject_id, reliability, source_id) VALUES (?, ?, ?, ?, ?, ?)",
    ('EV-OK-P', 1, 'P', 'GN-P1', 'V', 'S-1'),
)
conn.execute(
    "INSERT INTO event(event_id, event_type_id, subject_type, subject_id, reliability, source_id) VALUES (?, ?, ?, ?, ?, ?)",
    ('EV-OK-F', 1, 'F', 'GN-F1', 'V', 'S-1'),
)
conn.commit()
expect_integrity_error(
    conn,
    "INSERT INTO event(event_id, event_type_id, subject_type, subject_id, reliability, source_id) VALUES (?, ?, ?, ?, ?, ?)",
    ('EV-BAD-P', 1, 'P', 'GN-F1', 'V', 'S-1'),
)
expect_integrity_error(
    conn,
    "INSERT INTO event(event_id, event_type_id, subject_type, subject_id, reliability, source_id) VALUES (?, ?, ?, ?, ?, ?)",
    ('EV-BAD-F', 1, 'F', 'GN-P1', 'V', 'S-1'),
)
expect_integrity_error(
    conn,
    "UPDATE event SET subject_type='P', subject_id='GN-F1' WHERE event_id='EV-OK-F'",
)

# 2) Polymorphic trigger: heraldic_arm.subject_id
conn.execute(
    "INSERT INTO heraldic_arm(subject_type, subject_id, blazon, source_id) VALUES ('P', 'GN-P1', 'Azure', 'S-1')"
)
conn.execute(
    "INSERT INTO heraldic_arm(subject_type, subject_id, blazon, source_id) VALUES ('F', 'GN-F1', 'Gules', 'S-1')"
)
conn.commit()
expect_integrity_error(
    conn,
    "INSERT INTO heraldic_arm(subject_type, subject_id, blazon, source_id) VALUES ('P', 'GN-F1', 'Or', 'S-1')",
)
expect_integrity_error(
    conn,
    "INSERT INTO heraldic_arm(subject_type, subject_id, blazon, source_id) VALUES ('F', 'GN-P1', 'Vert', 'S-1')",
)
expect_integrity_error(
    conn,
    "UPDATE heraldic_arm SET subject_type='F', subject_id='GN-P1' WHERE arm_id=1",
)

# 3) Reliability transition trigger
conn.execute("INSERT INTO person(person_id, sex, reliability, hash_state) VALUES ('GN-P3', 'U', 'E', 'h3')")
conn.commit()
conn.execute("UPDATE person SET reliability='I' WHERE person_id='GN-P3'")  # non-V transition allowed
conn.commit()
expect_integrity_error(conn, "UPDATE person SET reliability='V', source_id=NULL WHERE person_id='GN-P3'")
conn.execute("UPDATE person SET source_id='S-1', reliability='V' WHERE person_id='GN-P3'")
conn.commit()

conn.execute("INSERT INTO family(family_id, reliability) VALUES ('GN-F2', 'E')")
conn.commit()
expect_integrity_error(conn, "UPDATE family SET reliability='V', source_id=NULL WHERE family_id='GN-F2'")
conn.execute("UPDATE family SET source_id='S-1', reliability='V' WHERE family_id='GN-F2'")
conn.commit()

conn.execute(
    "INSERT INTO event(event_id, event_type_id, subject_type, subject_id, reliability) VALUES ('EV-R1', 1, 'P', 'GN-P1', 'E')"
)
conn.commit()
expect_integrity_error(conn, "UPDATE event SET reliability='V', source_id=NULL WHERE event_id='EV-R1'")
conn.execute("UPDATE event SET source_id='S-1', reliability='V' WHERE event_id='EV-R1'")
conn.commit()

# 4) Journal hash-chain trigger
GENESIS = '0' * 64
payload1 = '{"op":"create","id":"GN-P1"}'
hash1 = sha256_hex(GENESIS + payload1)

expect_integrity_error(
    conn,
    "INSERT INTO event_journal(agent_id,event_class,entity_type,entity_id,payload,session_id,prev_hash,entry_hash) "
    "VALUES (?,?,?,?,?,?,?,?)",
    ('PARSE_AGT', 'PERSON_CREATED', 'PERSON', 'GN-P1', payload1, 'sess-1', 'a' * 64, hash1),
)
expect_integrity_error(
    conn,
    "INSERT INTO event_journal(agent_id,event_class,entity_type,entity_id,payload,session_id,prev_hash,entry_hash) "
    "VALUES (?,?,?,?,?,?,?,?)",
    ('PARSE_AGT', 'PERSON_CREATED', 'PERSON', 'GN-P1', payload1, 'sess-1', GENESIS, 'b' * 64),
)
conn.execute(
    "INSERT INTO event_journal(agent_id,event_class,entity_type,entity_id,payload,session_id,prev_hash,entry_hash) "
    "VALUES (?,?,?,?,?,?,?,?)",
    ('PARSE_AGT', 'PERSON_CREATED', 'PERSON', 'GN-P1', payload1, 'sess-1', GENESIS, hash1),
)
conn.commit()

payload2 = '{"op":"update","id":"GN-P1"}'
hash2 = sha256_hex(hash1 + payload2)
expect_integrity_error(
    conn,
    "INSERT INTO event_journal(agent_id,event_class,entity_type,entity_id,payload,session_id,prev_hash,entry_hash) "
    "VALUES (?,?,?,?,?,?,?,?)",
    ('NORM_AGT', 'PERSON_UPDATED', 'PERSON', 'GN-P1', payload2, 'sess-1', GENESIS, hash2),
)
expect_integrity_error(
    conn,
    "INSERT INTO event_journal(agent_id,event_class,entity_type,entity_id,payload,session_id,prev_hash,entry_hash) "
    "VALUES (?,?,?,?,?,?,?,?)",
    ('NORM_AGT', 'PERSON_UPDATED', 'PERSON', 'GN-P1', payload2, 'sess-1', hash1, 'c' * 64),
)
conn.execute(
    "INSERT INTO event_journal(agent_id,event_class,entity_type,entity_id,payload,session_id,prev_hash,entry_hash) "
    "VALUES (?,?,?,?,?,?,?,?)",
    ('NORM_AGT', 'PERSON_UPDATED', 'PERSON', 'GN-P1', payload2, 'sess-1', hash1, hash2),
)
conn.commit()

count = conn.execute("SELECT COUNT(*) FROM event_journal").fetchone()[0]
if count != 2:
    raise SystemExit(f'Unexpected journal row count: {count} (expected 2)')

print('integrity trigger tests: OK')
conn.close()
DB.unlink(missing_ok=True)