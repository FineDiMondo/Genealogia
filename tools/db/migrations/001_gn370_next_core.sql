-- GN370-NEXT core schema migration (v2026.03.1)
-- Compatible with SQLite for local validation.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_version (
  version_id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_code TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  description TEXT NOT NULL,
  migration_hash TEXT NOT NULL,
  applied_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source (
  source_id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  title TEXT NOT NULL,
  repository TEXT,
  reference TEXT,
  import_ts TEXT,
  import_hash TEXT
);

CREATE TABLE IF NOT EXISTS event_journal (
  journal_id INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  agent_id TEXT NOT NULL,
  event_class TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_cmd TEXT,
  prev_hash TEXT NOT NULL,
  entry_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conflict_log (
  conflict_id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT,
  entity_id TEXT,
  field_name TEXT,
  value_a TEXT,
  value_b TEXT,
  source_a_id TEXT,
  source_b_id TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RESOLVED','DEFERRED')),
  resolution_note TEXT,
  detected_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_a_id) REFERENCES source(source_id),
  FOREIGN KEY (source_b_id) REFERENCES source(source_id)
);

CREATE TABLE IF NOT EXISTS schema_version_ref (
  version_code TEXT PRIMARY KEY,
  FOREIGN KEY (version_code) REFERENCES schema_version(version_code)
);

CREATE TABLE IF NOT EXISTS field_mapping (
  mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_format TEXT NOT NULL,
  copybook_field TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_column TEXT NOT NULL,
  transform_fn TEXT,
  schema_version TEXT,
  FOREIGN KEY (schema_version) REFERENCES schema_version(version_code)
);

CREATE TABLE IF NOT EXISTS lexicon (
  term_id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL,
  code TEXT NOT NULL,
  label_it TEXT NOT NULL,
  label_en TEXT NOT NULL,
  definition TEXT NOT NULL,
  introduced_in TEXT,
  deprecated_in TEXT,
  FOREIGN KEY (introduced_in) REFERENCES schema_version(version_code),
  FOREIGN KEY (deprecated_in) REFERENCES schema_version(version_code),
  UNIQUE (domain, code)
);

INSERT OR IGNORE INTO schema_version (version_code, description, migration_hash, applied_by)
VALUES ('2026.03.1', 'GN370-NEXT core metadata/journal tables', 'sha256:pending', 'migration-001');
