-- Migration 002: indexes
-- GN370-NEXT v0.1

CREATE INDEX IF NOT EXISTS idx_pname_surname ON person_name (surname, given_name);
CREATE INDEX IF NOT EXISTS idx_pname_person ON person_name (person_id);

CREATE INDEX IF NOT EXISTS idx_event_type ON event (event_type_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_event_date ON event (event_year, event_month);
