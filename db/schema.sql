-- GN370 embedded SQL schema (deterministic reset at boot)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS GN370_TABLE_META (
  table_name TEXT PRIMARY KEY,
  row_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS GN370_ROW_STORE (
  table_name TEXT NOT NULL,
  row_seq INTEGER NOT NULL,
  row_id TEXT,
  payload_json TEXT NOT NULL,
  PRIMARY KEY (table_name, row_seq)
);

CREATE INDEX IF NOT EXISTS IDX_GN370_ROW_STORE_TABLE
  ON GN370_ROW_STORE (table_name);

CREATE INDEX IF NOT EXISTS IDX_GN370_ROW_STORE_ROWID
  ON GN370_ROW_STORE (row_id);

-- Core typed mirror tables (post-V0 step 1)
CREATE TABLE IF NOT EXISTS GN370_PERSON (
  person_id TEXT PRIMARY KEY,
  gedcom_id TEXT,
  surname TEXT,
  given_name TEXT,
  gender TEXT,
  birth_date TEXT,
  birth_qual TEXT,
  birth_cal TEXT,
  birth_place TEXT,
  death_date TEXT,
  death_qual TEXT,
  death_cal TEXT,
  death_place TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS IDX_GN370_PERSON_SURNAME
  ON GN370_PERSON (surname);

CREATE TABLE IF NOT EXISTS GN370_FAMILY (
  family_id TEXT PRIMARY KEY,
  father_id TEXT,
  mother_id TEXT,
  union_date TEXT,
  union_date_qual TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS IDX_GN370_FAMILY_PARENTS
  ON GN370_FAMILY (father_id, mother_id);

CREATE TABLE IF NOT EXISTS GN370_PLACE (
  place_id TEXT PRIMARY KEY,
  place_name TEXT,
  parent_id TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS IDX_GN370_PLACE_NAME
  ON GN370_PLACE (place_name);

CREATE TABLE IF NOT EXISTS GN370_SOURCE (
  source_id TEXT PRIMARY KEY,
  title TEXT,
  author TEXT,
  source_type TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS IDX_GN370_SOURCE_TITLE
  ON GN370_SOURCE (title);

CREATE TABLE IF NOT EXISTS GN370_EVENT (
  event_id TEXT PRIMARY KEY,
  person_id TEXT,
  family_id TEXT,
  event_type TEXT,
  event_date TEXT,
  event_date_qual TEXT,
  place_id TEXT,
  source_id TEXT,
  note TEXT
);

CREATE INDEX IF NOT EXISTS IDX_GN370_EVENT_PERSON
  ON GN370_EVENT (person_id);

CREATE INDEX IF NOT EXISTS IDX_GN370_EVENT_FAMILY
  ON GN370_EVENT (family_id);

CREATE TABLE IF NOT EXISTS GN370_CITATION (
  citation_id TEXT PRIMARY KEY,
  source_id TEXT,
  person_id TEXT,
  family_id TEXT,
  event_id TEXT,
  page TEXT,
  note TEXT
);

CREATE INDEX IF NOT EXISTS IDX_GN370_CITATION_SOURCE
  ON GN370_CITATION (source_id);

CREATE TABLE IF NOT EXISTS GN370_IMPORT_AUDIT (
  import_id TEXT PRIMARY KEY,
  source_label TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  records_total INTEGER NOT NULL DEFAULT 0
);
