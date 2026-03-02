-- Migration 002: lexicon seed
-- GN370-NEXT v0.1

INSERT OR IGNORE INTO lexicon (domain, code, label_it, label_en, definition, introduced_in)
VALUES
  ('RELIABILITY', 'V', 'Verificato', 'Verified', 'Dato verificato da fonte primaria.', '2026.03.2'),
  ('RELIABILITY', 'D', 'Derivato', 'Derived', 'Dato derivato da regole deterministiche.', '2026.03.2'),
  ('RELIABILITY', 'I', 'Inferito', 'Inferred', 'Dato inferito da evidenze indirette.', '2026.03.2'),
  ('RELIABILITY', 'E', 'Stimato', 'Estimated', 'Dato stimato o approssimato.', '2026.03.2'),
  ('RELIABILITY', 'C', 'Conflitto', 'Conflicted', 'Dato in conflitto tra fonti.', '2026.03.2'),
  ('RELIABILITY', 'IA', 'Inferito-AI', 'Inferred-AI', 'Ipotesi prodotta da AI, non verificata.', '2026.03.2');

INSERT OR IGNORE INTO lexicon (domain, code, label_it, label_en, definition, introduced_in)
VALUES
  ('AGENT_ID', 'PARSE_AGT', 'Parser Agent', 'Parser Agent', 'Parsing input raw in struttura tipizzata.', '2026.03.2'),
  ('AGENT_ID', 'NORM_AGT', 'Normalizer Agent', 'Normalizer Agent', 'Normalizzazione e deduplicazione.', '2026.03.2'),
  ('AGENT_ID', 'VALID_AGT', 'Validator Agent', 'Validator Agent', 'Validazione regole business.', '2026.03.2'),
  ('AGENT_ID', 'STORY_AGT', 'Storyteller Agent', 'Storyteller Agent', 'Render narrativo tracciabile.', '2026.03.2'),
  ('AGENT_ID', 'SYNC_AGT', 'Synchronizer Agent', 'Synchronizer Agent', 'Sincronizzazione fonti esterne.', '2026.03.2'),
  ('AGENT_ID', 'EXPL_AGT', 'Explainer Agent', 'Explainer Agent', 'Spiegazione derivazioni.', '2026.03.2'),
  ('AGENT_ID', 'INFER_AGT', 'Inference Agent', 'Inference Agent', 'Inferenze AI in modalita suggerimento.', '2026.03.2');

INSERT OR IGNORE INTO lexicon (domain, code, label_it, label_en, definition, introduced_in)
VALUES
  ('AGENT_STATUS', 'IDLE', 'Inattivo', 'Idle', 'Agente inattivo senza coda.', '2026.03.2'),
  ('AGENT_STATUS', 'ACTIVE', 'Attivo', 'Active', 'Agente in elaborazione.', '2026.03.2'),
  ('AGENT_STATUS', 'DEGRADED', 'Degradato', 'Degraded', 'Agente in modalita limitata.', '2026.03.2'),
  ('AGENT_STATUS', 'BLOCKED', 'Bloccato', 'Blocked', 'Agente bloccato da errore.', '2026.03.2');

INSERT OR IGNORE INTO lexicon (domain, code, label_it, label_en, definition, introduced_in)
VALUES
  ('EVENT_TYPE', 'BIRTH', 'Nascita', 'Birth', 'Nascita persona.', '2026.03.2'),
  ('EVENT_TYPE', 'DEATH', 'Morte', 'Death', 'Morte persona.', '2026.03.2'),
  ('EVENT_TYPE', 'MARRIAGE', 'Matrimonio', 'Marriage', 'Unione famiglia.', '2026.03.2'),
  ('EVENT_TYPE', 'CENSUS', 'Censimento', 'Census', 'Evento censuario.', '2026.03.2'),
  ('EVENT_TYPE', 'BAPTISM', 'Battesimo', 'Baptism', 'Battesimo persona.', '2026.03.2'),
  ('EVENT_TYPE', 'BURIAL', 'Sepoltura', 'Burial', 'Sepoltura persona.', '2026.03.2'),
  ('EVENT_TYPE', 'DIVORCE', 'Divorzio', 'Divorce', 'Scioglimento unione.', '2026.03.2'),
  ('EVENT_TYPE', 'RESIDENCE', 'Residenza', 'Residence', 'Residenza documentata.', '2026.03.2');

INSERT OR IGNORE INTO lexicon (domain, code, label_it, label_en, definition, introduced_in)
VALUES
  ('UNION_TYPE', 'MARRIAGE', 'Matrimonio', 'Marriage', 'Unione matrimoniale.', '2026.03.2'),
  ('UNION_TYPE', 'COHABITATION', 'Convivenza', 'Cohabitation', 'Unione di convivenza.', '2026.03.2'),
  ('UNION_TYPE', 'CONCUBINAGE', 'Concubinato', 'Concubinage', 'Unione storica non matrimoniale.', '2026.03.2'),
  ('UNION_TYPE', 'UNKNOWN', 'Sconosciuto', 'Unknown', 'Tipo unione non noto.', '2026.03.2');

INSERT OR IGNORE INTO lexicon (domain, code, label_it, label_en, definition, introduced_in)
VALUES
  ('FAMILY_MEMBER_ROLE', 'PARTNER_A', 'Partner A', 'Partner A', 'Partner principale A.', '2026.03.2'),
  ('FAMILY_MEMBER_ROLE', 'PARTNER_B', 'Partner B', 'Partner B', 'Partner principale B.', '2026.03.2'),
  ('FAMILY_MEMBER_ROLE', 'CHILD', 'Figlio', 'Child', 'Figlio biologico.', '2026.03.2'),
  ('FAMILY_MEMBER_ROLE', 'ADOPTEE', 'Adottato', 'Adoptee', 'Figlio adottivo.', '2026.03.2'),
  ('FAMILY_MEMBER_ROLE', 'FOSTER', 'Affido', 'Foster', 'Minore in affido.', '2026.03.2');

INSERT OR IGNORE INTO lexicon (domain, code, label_it, label_en, definition, introduced_in)
VALUES
  ('SUBJECT_TYPE', 'P', 'Persona', 'Person', 'Soggetto di tipo persona.', '2026.03.2'),
  ('SUBJECT_TYPE', 'F', 'Famiglia', 'Family', 'Soggetto di tipo famiglia.', '2026.03.2');

INSERT OR IGNORE INTO lexicon (domain, code, label_it, label_en, definition, introduced_in)
VALUES
  ('SOURCE_TYPE', 'GEDCOM', 'GEDCOM', 'GEDCOM', 'Fonte file GEDCOM.', '2026.03.2'),
  ('SOURCE_TYPE', 'CIVIL_REG', 'Registro Civile', 'Civil Registry', 'Fonte registro civile.', '2026.03.2'),
  ('SOURCE_TYPE', 'CHURCH', 'Registro Ecclesiastico', 'Church Register', 'Fonte ecclesiastica.', '2026.03.2'),
  ('SOURCE_TYPE', 'CENSUS', 'Censimento', 'Census', 'Fonte censuaria.', '2026.03.2'),
  ('SOURCE_TYPE', 'ORAL', 'Tradizione Orale', 'Oral', 'Fonte orale.', '2026.03.2'),
  ('SOURCE_TYPE', 'API_EXTERNAL', 'API Esterna', 'External API', 'Fonte API esterna.', '2026.03.2');

INSERT OR IGNORE INTO lexicon (domain, code, label_it, label_en, definition, introduced_in)
VALUES
  ('PANEL_ALG_CODE', 'LL(1) PARSER', 'Parser LL(1)', 'LL(1) Parser', 'Parsing sintattico deterministico.', '2026.03.2'),
  ('PANEL_ALG_CODE', 'JARO-WINKLER', 'Jaro-Winkler', 'Jaro-Winkler', 'Similarita stringhe.', '2026.03.2'),
  ('PANEL_ALG_CODE', '3NF QUERY', 'Query 3NF', '3NF Query', 'Query su schema normalizzato.', '2026.03.2'),
  ('PANEL_ALG_CODE', 'SHA256 VERIFY', 'Verifica SHA256', 'SHA256 Verify', 'Verifica integrita hash.', '2026.03.2'),
  ('PANEL_ALG_CODE', 'DIFF ENGINE', 'Motore Diff', 'Diff Engine', 'Confronto strutturale record.', '2026.03.2'),
  ('PANEL_ALG_CODE', 'TEMPLATE RENDER', 'Render Template', 'Template Render', 'Render narrativa da template.', '2026.03.2'),
  ('PANEL_ALG_CODE', 'DFS CYCLE-CHECK', 'Controllo cicli DFS', 'DFS Cycle-Check', 'Rilevazione cicli genealogici.', '2026.03.2'),
  ('PANEL_ALG_CODE', 'NETWORK-FIRST', 'Network First', 'Network-First', 'Strategia fetch priorita rete.', '2026.03.2');

INSERT OR IGNORE INTO lexicon (domain, code, label_it, label_en, definition, introduced_in)
VALUES
  ('PANEL_DATA_STATE', 'VERIFIED', 'Verificato', 'Verified', 'Dato verificato.', '2026.03.2'),
  ('PANEL_DATA_STATE', 'DERIVED', 'Derivato', 'Derived', 'Dato derivato.', '2026.03.2'),
  ('PANEL_DATA_STATE', 'INFERRED', 'Inferito', 'Inferred', 'Dato inferito.', '2026.03.2'),
  ('PANEL_DATA_STATE', 'ESTIMATED', 'Stimato', 'Estimated', 'Dato stimato.', '2026.03.2'),
  ('PANEL_DATA_STATE', 'CONFLICTED', 'Conflitto', 'Conflicted', 'Dato in conflitto.', '2026.03.2'),
  ('PANEL_DATA_STATE', 'IMPORT', 'Import', 'Import', 'Stato import in corso.', '2026.03.2'),
  ('PANEL_DATA_STATE', 'LIVE', 'Live', 'Live', 'Stato operativo.', '2026.03.2'),
  ('PANEL_DATA_STATE', 'AUDIT', 'Audit', 'Audit', 'Stato audit/tracciamento.', '2026.03.2');

INSERT OR IGNORE INTO lexicon (domain, code, label_it, label_en, definition, introduced_in)
VALUES
  ('CONFLICT_STATUS', 'OPEN', 'Aperto', 'Open', 'Conflitto aperto.', '2026.03.2'),
  ('CONFLICT_STATUS', 'RESOLVED', 'Risolto', 'Resolved', 'Conflitto risolto.', '2026.03.2'),
  ('CONFLICT_STATUS', 'DEFERRED', 'Rimandato', 'Deferred', 'Conflitto rimandato.', '2026.03.2');

INSERT OR IGNORE INTO lexicon (domain, code, label_it, label_en, definition, introduced_in)
VALUES
  ('COMMAND_VERB', 'FIND', 'Trova', 'Find', 'Ricerca entita.', '2026.03.2'),
  ('COMMAND_VERB', 'SHOW', 'Mostra', 'Show', 'Mostra dettaglio.', '2026.03.2'),
  ('COMMAND_VERB', 'COMPARE', 'Confronta', 'Compare', 'Confronta entita.', '2026.03.2'),
  ('COMMAND_VERB', 'IMPORT', 'Importa', 'Import', 'Importa dati.', '2026.03.2'),
  ('COMMAND_VERB', 'EXPORT', 'Esporta', 'Export', 'Esporta dati.', '2026.03.2'),
  ('COMMAND_VERB', 'STORY', 'Storia', 'Story', 'Render narrativa.', '2026.03.2'),
  ('COMMAND_VERB', 'EXPLAIN', 'Spiega', 'Explain', 'Spiega derivazione.', '2026.03.2'),
  ('COMMAND_VERB', 'SYNC', 'Sincronizza', 'Sync', 'Sincronizza fonti esterne.', '2026.03.2'),
  ('COMMAND_VERB', 'RESOLVE', 'Risolvi', 'Resolve', 'Risolvi conflitto.', '2026.03.2'),
  ('COMMAND_VERB', 'VALIDATE', 'Valida', 'Validate', 'Valida consistenza.', '2026.03.2'),
  ('COMMAND_VERB', 'HISTORY', 'Storico', 'History', 'Mostra storico.', '2026.03.2'),
  ('COMMAND_VERB', 'DB', 'Database', 'DB', 'Comandi database.', '2026.03.2'),
  ('COMMAND_VERB', 'HELP', 'Aiuto', 'Help', 'Aiuto sintassi.', '2026.03.2'),
  ('COMMAND_VERB', 'HOME', 'Home', 'Home', 'Torna a home.', '2026.03.2'),
  ('COMMAND_VERB', 'GO', 'Vai', 'Go', 'Navigazione rapida.', '2026.03.2'),
  ('COMMAND_VERB', 'END', 'Fine', 'End', 'Termina sessione.', '2026.03.2'),
  ('COMMAND_VERB', 'REFRESH', 'Aggiorna', 'Refresh', 'Aggiorna vista.', '2026.03.2');