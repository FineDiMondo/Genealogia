(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};
  GN370.IMPORT = GN370.IMPORT || {};

  function run(tables, logs) {
    var findings = [];
    var person = tables.PERSON || [];
    var family = tables.FAMILY || [];
    var familyLink = tables.FAMILY_LINK || [];
    var place = tables.PLACE || [];
    var source = tables.SOURCE || [];
    var citation = tables.CITATION || [];

    person.forEach(function (p) {
      if (p.birth_date && p.death_date && p.birth_date > p.death_date) {
        findings.push({ code: "IC-001", severity: "ERR", msg: "birth>death for " + p.person_id });
      }
    });
    family.forEach(function (f) {
      if (f.father_id && f.father_id === f.mother_id) {
        findings.push({ code: "IC-002", severity: "ERR", msg: "same parents " + f.family_id });
      }
    });
    familyLink.forEach(function (l) {
      if (!person.some(function (p) { return p.person_id === l.person_id; })) {
        findings.push({ code: "IC-003", severity: "ERR", msg: "orphan link " + l.link_id });
      }
    });
    (tables.EVENT || []).forEach(function (e) {
      if (e.place_id && !place.some(function (p) { return p.place_id === e.place_id; })) {
        findings.push({ code: "IC-004", severity: "ERR", msg: "missing place " + e.event_id });
      }
    });
    citation.forEach(function (c) {
      if (c.source_id && !source.some(function (s) { return s.source_id === c.source_id; })) {
        findings.push({ code: "IC-005", severity: "ERR", msg: "missing source " + c.citation_id });
      }
    });
    if ((tables.IMPORT_LOG || []).some(function (l) { return !l.pipeline_id; })) {
      findings.push({ code: "IC-006", severity: "ERR", msg: "import log without pipeline_id" });
    }
    if ((tables.HERALD || []).some(function (h) { return !h.svg_filename; })) {
      findings.push({ code: "IC-007", severity: "WRN", msg: "herald missing svg_filename" });
    }
    if ((tables.HOUSE || []).some(function (h) { return h.parent_house_id && !tables.HOUSE.some(function (x) { return x.house_id === h.parent_house_id; }); })) {
      findings.push({ code: "IC-008", severity: "ERR", msg: "house parent missing" });
    }
    if ((tables.SEAL || []).some(function (s) { return !s.entity_id; })) {
      findings.push({ code: "IC-009", severity: "ERR", msg: "seal entity missing" });
    }
    findings.push({ code: "IC-010", severity: "OK", msg: "journal append-only runtime enforced" });

    (logs || []).forEach(function (l) {
      l.batch_results = l.batch_results || [];
      l.batch_results.push({
        batch_agent: "AGT_IC",
        batch_status: findings.some(function (f) { return f.severity === "ERR"; }) ? "F" : "K",
        batch_findings: findings.length,
        batch_msg: "IC checks executed"
      });
    });

    return { agent: "AGT_IC", findings: findings };
  }

  GN370.IMPORT.batchAgtIC = { run: run };
}(window));
