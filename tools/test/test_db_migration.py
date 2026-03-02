import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / 'tools' / 'db' / 'migrations' / '001_gn370_next_core.sql'
DB = ROOT / 'tools' / 'test' / '_tmp_gn370_next_schema.sqlite'

if DB.exists():
    DB.unlink()

conn = sqlite3.connect(DB)
conn.execute('PRAGMA foreign_keys = ON;')
conn.executescript(MIGRATION.read_text(encoding='utf-8'))

required_tables = {
    'schema_version',
    'event_journal',
    'conflict_log',
    'field_mapping',
    'lexicon',
}
rows = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
actual = {r[0] for r in rows}
missing = sorted(required_tables - actual)
if missing:
    raise SystemExit(f'Missing tables: {missing}')

# Check unique constraint in lexicon
conn.execute(
    "INSERT INTO lexicon(domain, code, label_it, label_en, definition) VALUES (?, ?, ?, ?, ?)",
    ('RELIABILITY', 'V', 'Verificato', 'Verified', 'Dato verificato da fonte primaria')
)
try:
    conn.execute(
        "INSERT INTO lexicon(domain, code, label_it, label_en, definition) VALUES (?, ?, ?, ?, ?)",
        ('RELIABILITY', 'V', 'Verificato2', 'Verified2', 'Duplicate should fail')
    )
    raise SystemExit('Expected UNIQUE(domain, code) violation was not raised')
except sqlite3.IntegrityError:
    pass

# Check status check constraint in conflict_log
try:
    conn.execute(
        "INSERT INTO conflict_log(entity_type, entity_id, status) VALUES (?, ?, ?)",
        ('PERSON', 'GN-0000000001', 'INVALID')
    )
    raise SystemExit('Expected CHECK(status) violation was not raised')
except sqlite3.IntegrityError:
    pass

# Check migration version bootstrap row exists
ver = conn.execute("SELECT version_code FROM schema_version WHERE version_code='2026.03.1'").fetchone()
if not ver:
    raise SystemExit('Missing bootstrap schema_version row 2026.03.1')

print('DB migration test: OK')
conn.close()
DB.unlink(missing_ok=True)