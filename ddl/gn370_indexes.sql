CREATE INDEX idx_person_surname ON PERSON(surname);
CREATE INDEX idx_family_parents ON FAMILY(father_id, mother_id);
CREATE INDEX idx_event_person ON EVENT(person_id);
CREATE INDEX idx_citation_source ON CITATION(source_id);
CREATE INDEX idx_house_name ON HOUSE(house_name);
