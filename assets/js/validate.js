(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};

  function addError(arr, id, msg) {
    arr.push({ severity: "ERROR", code: id, message: msg });
  }

  function addWarn(arr, id, msg) {
    arr.push({ severity: "WARN", code: id, message: msg });
  }

  function run(tables) {
    var errors = [];
    var warnings = [];
    var person = tables.PERSON || [];
    var family = tables.FAMILY || [];
    var events = tables.EVENT || [];
    var sources = tables.SOURCE || [];
    var citations = tables.CITATION || [];

    person.forEach(function (p) {
      if (p.birth_date && p.death_date && p.birth_qual === "E" && p.death_qual === "E" && p.birth_date > p.death_date) {
        addError(errors, "IC-001", "birth_date > death_date for " + p.person_id);
      }
      var hasEvent = events.some(function (e) { return e.person_id === p.person_id; });
      if (!hasEvent) {
        addWarn(warnings, "W-001", "No events for " + p.person_id);
      }
    });

    family.forEach(function (f) {
      if (f.father_id && f.father_id === f.mother_id) {
        addError(errors, "IC-002", "father_id = mother_id for " + f.family_id);
      }
    });

    citations.forEach(function (c) {
      var ok = sources.some(function (s) { return s.source_id === c.source_id; });
      if (!ok) {
        addError(errors, "IC-005", "citation without source " + c.citation_id);
      }
    });

    return {
      errors: errors,
      warnings: warnings,
      stats: {
        checked: person.length + family.length + events.length + sources.length + citations.length,
        error_count: errors.length,
        warning_count: warnings.length
      }
    };
  }

  GN370.VALIDATE = {
    run: run
  };
}(window));
