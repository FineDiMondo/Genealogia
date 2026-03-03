(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  GN370.IMPORT = GN370.IMPORT || {};

  function newRawRecord(xref, recordType, pipelineId) {
    return {
      pipeline_id: pipelineId,
      gedcom_xref: xref,
      record_type: recordType,
      raw_name: "",
      raw_surname: "",
      raw_given: "",
      raw_sex: "",
      raw_birth_date: "",
      raw_birth_place: "",
      raw_death_date: "",
      raw_death_place: "",
      raw_burial_date: "",
      raw_burial_place: "",
      raw_title: "",
      raw_occu: "",
      raw_reli: "",
      raw_note: "",
      raw_husb: "",
      raw_wife: "",
      raw_chil: "",
      raw_chil_refs: [],
      raw_fams_refs: [],
      raw_famc_refs: [],
      sour_refs: [],
      mapped_ts: "",
      map_status: "K",
      tags_found: [],
      tags_unmapped: []
    };
  }

  function splitGedcomName(value) {
    var v = String(value || "");
    var m = v.match(/^(.*)\/(.*)\/(.*)$/);
    if (!m) {
      return { given: v.trim(), surname: "" };
    }
    return { given: m[1].trim(), surname: m[2].trim() };
  }

  function map(tokenized, ctx) {
    var tokens = tokenized.tokens || [];
    var rawRecords = [];
    var current = null;
    var mode = "";
    var pipelineSeq = 0;

    function mkId() {
      pipelineSeq += 1;
      var s = (ctx && ctx.sessionId) || "GED";
      return s + "-" + String(pipelineSeq).padStart(5, "0");
    }

    tokens.forEach(function (tok) {
      if (tok.level === 0 && ["INDI", "FAM", "SOUR", "PLAC", "OBJE"].indexOf(tok.tag) >= 0) {
        current = newRawRecord(tok.xref, tok.tag, mkId());
        rawRecords.push(current);
        mode = "";
        return;
      }
      if (!current) {
        return;
      }

      current.tags_found.push(tok.tag);
      if (tok.tag === "BIRT") { mode = "BIRT"; return; }
      if (tok.tag === "DEAT") { mode = "DEAT"; return; }
      if (tok.tag === "BURI") { mode = "BURI"; return; }

      if (tok.tag === "NAME") {
        current.raw_name = tok.value;
        var nameParts = splitGedcomName(tok.value);
        current.raw_given = nameParts.given;
        current.raw_surname = nameParts.surname;
        return;
      }
      if (tok.tag === "SEX") { current.raw_sex = tok.value; return; }
      if (tok.tag === "DATE") {
        if (mode === "BIRT") { current.raw_birth_date = tok.value; return; }
        if (mode === "DEAT") { current.raw_death_date = tok.value; return; }
        if (mode === "BURI") { current.raw_burial_date = tok.value; return; }
      }
      if (tok.tag === "PLAC") {
        if (mode === "BIRT") { current.raw_birth_place = tok.value; return; }
        if (mode === "DEAT") { current.raw_death_place = tok.value; return; }
        if (mode === "BURI") { current.raw_burial_place = tok.value; return; }
      }
      if (tok.tag === "TITL") { current.raw_title = tok.value; return; }
      if (tok.tag === "OCCU") { current.raw_occu = tok.value; return; }
      if (tok.tag === "RELI") { current.raw_reli = tok.value; return; }
      if (tok.tag === "NOTE") { current.raw_note = tok.value; return; }
      if (tok.tag === "CONT") { current.raw_note += "\n" + tok.value; return; }
      if (tok.tag === "CONC") { current.raw_note += tok.value; return; }
      if (tok.tag === "SOUR") {
        current.sour_refs.push(tok.value);
        return;
      }
      if (tok.tag === "HUSB" || tok.tag === "WIFE" || tok.tag === "FILE") {
        current["raw_" + tok.tag.toLowerCase()] = tok.value;
        return;
      }
      if (tok.tag === "CHIL") {
        current.raw_chil = tok.value;
        current.raw_chil_refs.push(tok.value);
        return;
      }
      if (tok.tag === "FAMS") {
        current.raw_fams_refs.push(tok.value);
        return;
      }
      if (tok.tag === "FAMC") {
        current.raw_famc_refs.push(tok.value);
        return;
      }
      current.tags_unmapped.push(tok.tag);
    });

    rawRecords.forEach(function (r) {
      r.mapped_ts = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
      r.sour_ref_count = r.sour_refs.length;
      if (r.tags_unmapped.length > 0) {
        r.map_status = "W";
      }
    });

    return {
      records: rawRecords,
      stats: {
        count: rawRecords.length,
        warnings: rawRecords.reduce(function (a, r) { return a + (r.tags_unmapped.length ? 1 : 0); }, 0)
      }
    };
  }

  GN370.IMPORT.gedcomMapper = {
    map: map
  };
}(window));
