-- SQL baseline for COBOL/CICS migration

CREATE TABLE IF NOT EXISTS persons (
    id              BIGINT PRIMARY KEY,
    given_name      VARCHAR(100) NOT NULL,
    surname         VARCHAR(100) NOT NULL,
    sex             CHAR(1),
    birth_date      DATE,
    death_date      DATE,
    place_id        BIGINT,
    version_no      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS families (
    id              BIGINT PRIMARY KEY,
    spouse1_id      BIGINT,
    spouse2_id      BIGINT,
    marriage_date   DATE,
    place_id        BIGINT,
    version_no      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id              BIGINT PRIMARY KEY,
    person_id       BIGINT,
    family_id       BIGINT,
    event_type      VARCHAR(30) NOT NULL,
    event_date      DATE,
    place_id        BIGINT,
    source_id       BIGINT,
    version_no      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
