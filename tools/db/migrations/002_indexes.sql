-- Migration 002: indexes
-- GN370-NEXT v0.1

CREATE INDEX IF NOT EXISTS idx_pname_surname ON person_name (surname, given_name);
CREATE INDEX IF NOT EXISTS idx_pname_person ON person_name (person_id);

CREATE INDEX IF NOT EXISTS idx_event_type ON event (event_type_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_event_date ON event (event_year, event_month);

CREATE INDEX IF NOT EXISTS idx_journal_entity ON event_journal (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_journal_agent ON event_journal (agent_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_journal_sess ON event_journal (session_id);

CREATE INDEX IF NOT EXISTS idx_conflict_open ON conflict_log (status) WHERE status = 'OPEN';