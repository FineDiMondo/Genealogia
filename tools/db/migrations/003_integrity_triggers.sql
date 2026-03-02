-- Migration 003: integrity triggers
-- GN370-NEXT v0.1

PRAGMA foreign_keys = ON;

-- Event polymorphic integrity (subject_type P/F against person/family)
CREATE TRIGGER IF NOT EXISTS trg_event_subject_check_insert
BEFORE INSERT ON event
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.subject_type = 'P' AND NOT EXISTS (
      SELECT 1 FROM person p WHERE p.person_id = NEW.subject_id
    ) THEN RAISE(ABORT, 'event subject_id not found in person')
    WHEN NEW.subject_type = 'F' AND NOT EXISTS (
      SELECT 1 FROM family f WHERE f.family_id = NEW.subject_id
    ) THEN RAISE(ABORT, 'event subject_id not found in family')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_event_subject_check_update
BEFORE UPDATE OF subject_type, subject_id ON event
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.subject_type = 'P' AND NOT EXISTS (
      SELECT 1 FROM person p WHERE p.person_id = NEW.subject_id
    ) THEN RAISE(ABORT, 'event subject_id not found in person')
    WHEN NEW.subject_type = 'F' AND NOT EXISTS (
      SELECT 1 FROM family f WHERE f.family_id = NEW.subject_id
    ) THEN RAISE(ABORT, 'event subject_id not found in family')
  END;
END;

-- Heraldic arm polymorphic integrity (subject_type P/F against person/family)
CREATE TRIGGER IF NOT EXISTS trg_arm_subject_check_insert
BEFORE INSERT ON heraldic_arm
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.subject_type = 'P' AND NOT EXISTS (
      SELECT 1 FROM person p WHERE p.person_id = NEW.subject_id
    ) THEN RAISE(ABORT, 'heraldic_arm subject_id not found in person')
    WHEN NEW.subject_type = 'F' AND NOT EXISTS (
      SELECT 1 FROM family f WHERE f.family_id = NEW.subject_id
    ) THEN RAISE(ABORT, 'heraldic_arm subject_id not found in family')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_arm_subject_check_update
BEFORE UPDATE OF subject_type, subject_id ON heraldic_arm
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.subject_type = 'P' AND NOT EXISTS (
      SELECT 1 FROM person p WHERE p.person_id = NEW.subject_id
    ) THEN RAISE(ABORT, 'heraldic_arm subject_id not found in person')
    WHEN NEW.subject_type = 'F' AND NOT EXISTS (
      SELECT 1 FROM family f WHERE f.family_id = NEW.subject_id
    ) THEN RAISE(ABORT, 'heraldic_arm subject_id not found in family')
  END;
END;

-- Reliability transitions: upgrade to VERIFIED requires source_id
CREATE TRIGGER IF NOT EXISTS trg_person_reliability_verified_requires_source
BEFORE UPDATE OF reliability, source_id ON person
FOR EACH ROW
WHEN NEW.reliability = 'V' AND OLD.reliability <> 'V' AND NEW.source_id IS NULL
BEGIN
  SELECT RAISE(ABORT, 'person reliability V requires source_id');
END;

CREATE TRIGGER IF NOT EXISTS trg_family_reliability_verified_requires_source
BEFORE UPDATE OF reliability, source_id ON family
FOR EACH ROW
WHEN NEW.reliability = 'V' AND OLD.reliability <> 'V' AND NEW.source_id IS NULL
BEGIN
  SELECT RAISE(ABORT, 'family reliability V requires source_id');
END;

CREATE TRIGGER IF NOT EXISTS trg_event_reliability_verified_requires_source
BEFORE UPDATE OF reliability, source_id ON event
FOR EACH ROW
WHEN NEW.reliability = 'V' AND OLD.reliability <> 'V' AND NEW.source_id IS NULL
BEGIN
  SELECT RAISE(ABORT, 'event reliability V requires source_id');
END;

-- Journal hash-chain integrity
-- Requires SQL function: sha256(text) -> lowercase 64-hex chars
CREATE TRIGGER IF NOT EXISTS trg_event_journal_hash_chain_insert
BEFORE INSERT ON event_journal
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.prev_hash IS NULL OR length(NEW.prev_hash) <> 64
      THEN RAISE(ABORT, 'event_journal prev_hash invalid length')
    WHEN NEW.entry_hash IS NULL OR length(NEW.entry_hash) <> 64
      THEN RAISE(ABORT, 'event_journal entry_hash invalid length')
  END;

  SELECT CASE
    WHEN (SELECT COUNT(*) FROM event_journal) = 0
         AND NEW.prev_hash <> '0000000000000000000000000000000000000000000000000000000000000000'
      THEN RAISE(ABORT, 'event_journal genesis prev_hash mismatch')
    WHEN (SELECT COUNT(*) FROM event_journal) > 0
         AND NEW.prev_hash <> (
           SELECT ej.entry_hash FROM event_journal ej ORDER BY ej.journal_id DESC LIMIT 1
         )
      THEN RAISE(ABORT, 'event_journal prev_hash does not match chain tip')
  END;

  SELECT CASE
    WHEN lower(NEW.entry_hash) <> lower(sha256(COALESCE(NEW.prev_hash, '') || COALESCE(NEW.payload, '')))
      THEN RAISE(ABORT, 'event_journal entry_hash mismatch')
  END;
END;

INSERT OR IGNORE INTO schema_version (version_code, description, migration_hash, applied_by)
VALUES ('2026.03.3', 'GN370 integrity triggers', 'sha256:pending', 'migration-003');
