-- GN370 schema v1.0
CREATE TABLE PERSON (
  person_id TEXT PRIMARY KEY,
  surname TEXT,
  given_name TEXT,
  gender TEXT,
  birth_date TEXT,
  death_date TEXT,
  notes TEXT
);
CREATE TABLE FAMILY (
  family_id TEXT PRIMARY KEY,
  father_id TEXT,
  mother_id TEXT,
  union_date TEXT
);
CREATE TABLE EVENT (
  event_id TEXT PRIMARY KEY,
  person_id TEXT,
  event_type TEXT,
  event_date TEXT
);
