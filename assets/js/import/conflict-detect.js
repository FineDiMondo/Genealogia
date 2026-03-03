(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  GN370.IMPORT = GN370.IMPORT || {};

  function safe(v) {
    return String(v || "").trim().toUpperCase();
  }

  function jaroWinkler(a, b) {
    a = safe(a);
    b = safe(b);
    if (!a && !b) { return 1; }
    if (!a || !b) { return 0; }
    if (a === b) { return 1; }

    var maxDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
    var aMatches = new Array(a.length).fill(false);
    var bMatches = new Array(b.length).fill(false);
    var matches = 0;

    for (var i = 0; i < a.length; i += 1) {
      var start = Math.max(0, i - maxDist);
      var end = Math.min(i + maxDist + 1, b.length);
      for (var j = start; j < end; j += 1) {
        if (bMatches[j]) { continue; }
        if (a[i] !== b[j]) { continue; }
        aMatches[i] = true;
        bMatches[j] = true;
        matches += 1;
        break;
      }
    }
    if (matches === 0) { return 0; }

    var t = 0;
    var k = 0;
    for (var x = 0; x < a.length; x += 1) {
      if (!aMatches[x]) { continue; }
      while (!bMatches[k]) { k += 1; }
      if (a[x] !== b[k]) { t += 1; }
      k += 1;
    }
    t = t / 2;
    var jaro = (matches / a.length + matches / b.length + (matches - t) / matches) / 3;

    var l = 0;
    while (l < 4 && a[l] && b[l] && a[l] === b[l]) {
      l += 1;
    }
    return jaro + l * 0.1 * (1 - jaro);
  }

  function dateScore(incoming, existing) {
    var a = safe(incoming);
    var b = safe(existing);
    if (!a && !b) { return 1; }
    if (!a || !b) { return 0.2; }
    if (a === b) { return 1; }
    if (/^\d{4}/.test(a) && /^\d{4}/.test(b) && a.slice(0, 4) === b.slice(0, 4)) {
      return 0.8;
    }
    return 0.3;
  }

  function calcSeverity(score) {
    if (score >= 85) { return "HIGH"; }
    if (score >= 70) { return "MEDIUM"; }
    if (score >= 55) { return "LOW"; }
    return "NONE";
  }

  function mapExistingFields(norm, existing) {
    return {
      existing_id: existing.person_id || existing.family_id || existing.source_id || existing.place_id || existing.media_id || "",
      surname: existing.surname || existing.house_name || existing.title_name || "",
      given: existing.given_name || existing.place_name || "",
      birth: existing.birth_date || existing.union_date || "",
      place: existing.birth_place || existing.place_name || existing.birth_place_id || ""
    };
  }

  function compare(norm, existing) {
    var fields = mapExistingFields(norm, existing);
    var scoreSurname = jaroWinkler(norm.surname_norm, fields.surname) * 100;
    var scoreGiven = jaroWinkler(norm.given_norm, fields.given) * 100;
    var scoreBirth = dateScore(norm.birth_date_iso, fields.birth) * 100;
    var scorePlace = jaroWinkler(norm.birth_place_norm, fields.place) * 100;
    var overall = Math.round(
      scoreSurname * 0.35 +
      scoreGiven * 0.25 +
      scoreBirth * 0.25 +
      scorePlace * 0.15
    );
    return {
      overall: overall,
      severity: calcSeverity(overall),
      fields: [
        { field_name: "surname", incoming: norm.surname_norm, existing: fields.surname },
        { field_name: "given", incoming: norm.given_norm, existing: fields.given },
        { field_name: "birth", incoming: norm.birth_date_iso, existing: fields.birth },
        { field_name: "place", incoming: norm.birth_place_norm, existing: fields.place }
      ],
      existing_id: fields.existing_id
    };
  }

  function pickTable(recordType) {
    if (recordType === "INDI") { return "PERSON"; }
    if (recordType === "FAM") { return "FAMILY"; }
    if (recordType === "SOUR") { return "SOURCE"; }
    if (recordType === "PLAC") { return "PLACE"; }
    if (recordType === "OBJE") { return "MEDIA"; }
    return "";
  }

  function detectAll(normRecords, tables) {
    var out = [];
    (normRecords || []).forEach(function (norm) {
      var table = pickTable(norm.record_type);
      var existingRows = table ? (tables[table] || []) : [];
      var best = null;
      existingRows.forEach(function (row) {
        var c = compare(norm, row);
        if (!best || c.overall > best.overall) {
          best = c;
        }
      });
      if (!best) {
        out.push({
          pipeline_id: norm.pipeline_id,
          incoming_xref: norm.gedcom_xref,
          existing_id: "",
          conflict_type: "NO_MATCH",
          similarity_score: 0,
          severity: "NONE",
          conflict_fields: [],
          field_count: 0,
          resolution: "ACCEPT_NEW",
          resolve_ts: "",
          resolve_by: ""
        });
        return;
      }
      out.push({
        pipeline_id: norm.pipeline_id,
        incoming_xref: norm.gedcom_xref,
        existing_id: best.existing_id,
        conflict_type: best.overall >= 90 ? "EXACT" : "FUZZY",
        similarity_score: best.overall,
        severity: best.severity,
        conflict_fields: best.fields,
        field_count: best.fields.length,
        resolution: best.severity === "NONE" ? "ACCEPT_NEW" : "PENDING",
        resolve_ts: "",
        resolve_by: ""
      });
    });
    return {
      reports: out,
      stats: {
        total: out.length,
        high: out.filter(function (r) { return r.severity === "HIGH"; }).length,
        medium: out.filter(function (r) { return r.severity === "MEDIUM"; }).length,
        low: out.filter(function (r) { return r.severity === "LOW"; }).length
      }
    };
  }

  GN370.IMPORT.conflictDetect = {
    jaroWinkler: jaroWinkler,
    detectAll: detectAll
  };
}(window));
