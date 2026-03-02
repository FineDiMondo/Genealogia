-- GN370 schema v2.0
CREATE TABLE PERSON (
  person_id TEXT PRIMARY KEY,
  gedcom_id TEXT,
  surname TEXT,
  given_name TEXT,
  gender TEXT,
  birth_date TEXT,
  birth_qual TEXT,
  birth_cal TEXT,
  death_date TEXT,
  death_qual TEXT,
  death_cal TEXT,
  notes TEXT
);
CREATE TABLE FAMILY (
  family_id TEXT PRIMARY KEY,
  father_id TEXT,
  mother_id TEXT,
  union_date TEXT,
  union_date_qual TEXT
);
CREATE TABLE FAMILY_LINK (
  link_id TEXT PRIMARY KEY,
  family_id TEXT,
  person_id TEXT,
  role TEXT
);
CREATE TABLE EVENT (
  event_id TEXT PRIMARY KEY,
  person_id TEXT,
  event_type TEXT,
  event_date TEXT,
  event_date_end TEXT,
  event_date_qual TEXT,
  event_cal TEXT,
  place_id TEXT,
  description TEXT
);
CREATE TABLE PERSON_EVENT (
  link_id TEXT PRIMARY KEY,
  person_id TEXT,
  event_id TEXT
);
CREATE TABLE PLACE (
  place_id TEXT PRIMARY KEY,
  place_name TEXT,
  parent_id TEXT,
  notes TEXT
);
CREATE TABLE SOURCE (
  source_id TEXT PRIMARY KEY,
  title TEXT,
  author TEXT,
  notes TEXT
);
CREATE TABLE CITATION (
  citation_id TEXT PRIMARY KEY,
  source_id TEXT,
  person_id TEXT,
  note TEXT
);
CREATE TABLE TITLE (
  title_id TEXT PRIMARY KEY,
  title_name TEXT,
  category TEXT,
  realm TEXT
);
CREATE TABLE TITLE_ASSIGNMENT (
  ta_id TEXT PRIMARY KEY,
  person_id TEXT,
  title_id TEXT,
  date_from TEXT,
  date_to TEXT
);
CREATE TABLE HOUSE (
  house_id TEXT PRIMARY KEY,
  house_name TEXT,
  parent_house_id TEXT,
  noble_rank TEXT,
  notes TEXT
);
CREATE TABLE PERSON_HOUSE (
  link_id TEXT PRIMARY KEY,
  person_id TEXT,
  house_id TEXT
);
CREATE TABLE MEDIA (
  media_id TEXT PRIMARY KEY,
  entity_type TEXT,
  entity_id TEXT,
  filename TEXT,
  is_vector TEXT
);
CREATE TABLE HERALD (
  herald_id TEXT PRIMARY KEY,
  house_id TEXT,
  blazon_ita TEXT,
  blazon_lat TEXT,
  svg_filename TEXT
);
CREATE TABLE SEAL (
  seal_id TEXT PRIMARY KEY,
  entity_type TEXT,
  entity_id TEXT,
  svg_filename TEXT
);
CREATE TABLE JOURNAL (
  journal_id TEXT PRIMARY KEY,
  entry_ts TEXT,
  op_type TEXT,
  entity_type TEXT,
  entity_id TEXT,
  description TEXT
);
