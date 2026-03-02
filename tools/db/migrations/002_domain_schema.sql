-- Migration 002: domain schema (tables only, no indexes)
-- GN370-NEXT v0.1

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS source (
  source_id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  title TEXT NOT NULL,
  repository TEXT,
  reference TEXT,
  import_ts TEXT,
  import_hash TEXT
);

CREATE TABLE IF NOT EXISTS schema_version (
  version_id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_code TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  description TEXT NOT NULL,
  migration_hash TEXT NOT NULL,
  applied_by TEXT NOT NULL
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

CREATE TABLE IF NOT EXISTS person (
  person_id TEXT PRIMARY KEY,
  sex TEXT NOT NULL CHECK (sex IN ('M', 'F', 'U')),
  reliability TEXT NOT NULL CHECK (reliability IN ('V', 'D', 'I', 'E', 'C')),
  source_id TEXT REFERENCES source(source_id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  hash_state TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS person_name (
  name_id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id TEXT NOT NULL REFERENCES person(person_id),
  name_type TEXT NOT NULL CHECK (name_type IN ('BIRTH', 'MARRIED', 'ALIAS', 'RELIGIOUS', 'NOBLE')),
  given_name TEXT,
  surname TEXT,
  suffix TEXT,
  lang_code TEXT,
  valid_from TEXT,
  valid_to TEXT,
  source_id TEXT REFERENCES source(source_id)
);

CREATE TABLE IF NOT EXISTS family (
  family_id TEXT PRIMARY KEY,
  partner_a_id TEXT REFERENCES person(person_id),
  partner_b_id TEXT REFERENCES person(person_id),
  union_type TEXT CHECK (union_type IN ('MARRIAGE', 'COHABITATION', 'CONCUBINAGE', 'UNKNOWN')),
  reliability TEXT NOT NULL CHECK (reliability IN ('V', 'D', 'I', 'E', 'C')),
  source_id TEXT REFERENCES source(source_id),
  CONSTRAINT no_self_union CHECK (partner_a_id IS NULL OR partner_b_id IS NULL OR partner_a_id <> partner_b_id)
);

CREATE TABLE IF NOT EXISTS family_member (
  family_id TEXT NOT NULL REFERENCES family(family_id),
  person_id TEXT NOT NULL REFERENCES person(person_id),
  role TEXT NOT NULL CHECK (role IN ('PARTNER_A', 'PARTNER_B', 'CHILD', 'ADOPTEE', 'FOSTER')),
  PRIMARY KEY (family_id, person_id)
);

CREATE TABLE IF NOT EXISTS event_type (
  event_type_id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label_it TEXT,
  label_en TEXT,
  subject_scope TEXT NOT NULL CHECK (subject_scope IN ('P', 'F', 'B'))
);

CREATE TABLE IF NOT EXISTS place (
  place_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  place_type TEXT,
  parent_id INTEGER REFERENCES place(place_id),
  lat NUMERIC,
  lon NUMERIC,
  wikidata_id TEXT
);

CREATE TABLE IF NOT EXISTS event (
  event_id TEXT PRIMARY KEY,
  event_type_id INTEGER NOT NULL REFERENCES event_type(event_type_id),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('P', 'F')),
  subject_id TEXT NOT NULL,
  place_id INTEGER REFERENCES place(place_id),
  event_year INTEGER,
  event_month INTEGER,
  event_day INTEGER,
  event_precision TEXT CHECK (event_precision IN ('DAY', 'MONTH', 'YEAR', 'ABT', 'BEF', 'AFT', 'CAL', 'RANGE', 'UNKNOWN')),
  event_calendar TEXT CHECK (event_calendar IN ('GREGORIAN', 'JULIAN', 'UNKNOWN')),
  description TEXT,
  reliability TEXT NOT NULL CHECK (reliability IN ('V', 'D', 'I', 'E', 'C')),
  source_id TEXT REFERENCES source(source_id)
);

CREATE TABLE IF NOT EXISTS title (
  title_id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id TEXT NOT NULL REFERENCES person(person_id),
  title_code TEXT NOT NULL,
  territory TEXT,
  valid_from TEXT,
  valid_to TEXT,
  source_id TEXT REFERENCES source(source_id)
);

CREATE TABLE IF NOT EXISTS heraldic_arm (
  arm_id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_type TEXT CHECK (subject_type IN ('P', 'F')),
  subject_id TEXT,
  blazon TEXT,
  image_hash TEXT,
  source_id TEXT REFERENCES source(source_id)
);

INSERT OR IGNORE INTO schema_version (version_code, description, migration_hash, applied_by)
VALUES ('2026.03.2', 'GN370 domain schema tables', 'sha256:pending', 'migration-002');