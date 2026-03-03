(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  GN370.IMPORT = GN370.IMPORT || {};

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function now14() {
    return new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  }

  function tableFromType(recordType) {
    if (recordType === "INDI") { return "PERSON"; }
    if (recordType === "FAM") { return "FAMILY"; }
    if (recordType === "SOUR") { return "SOURCE"; }
    if (recordType === "PLAC") { return "PLACE"; }
    if (recordType === "OBJE") { return "MEDIA"; }
    return "";
  }

  function idField(table) {
    if (table === "PERSON") { return "person_id"; }
    if (table === "FAMILY") { return "family_id"; }
    if (table === "SOURCE") { return "source_id"; }
    if (table === "PLACE") { return "place_id"; }
    if (table === "MEDIA") { return "media_id"; }
    return "id";
  }

  function idPrefix(table) {
    if (table === "PERSON") { return "GNP"; }
    if (table === "FAMILY") { return "GNF"; }
    if (table === "SOURCE") { return "GNS"; }
    if (table === "PLACE") { return "GPL"; }
    if (table === "MEDIA") { return "GNM"; }
    return "GNR";
  }

  function nextId(table, rows) {
    var prefix = idPrefix(table);
    return prefix + String((rows || []).length + 1).padStart(9, "0");
  }

  function toDbRecord(norm) {
    if (norm.record_type === "INDI") {
      return {
        person_id: "",
        gedcom_id: norm.gedcom_xref,
        surname: norm.surname_norm,
        given_name: norm.given_norm,
        gender: "U",
        birth_date: norm.birth_date_iso,
        birth_qual: norm.birth_date_qual,
        birth_cal: "G",
        birth_place: norm.birth_place_norm,
        death_date: norm.death_date_iso,
        death_qual: norm.death_date_qual,
        death_cal: "G",
        death_place: norm.death_place_norm,
        notes: ""
      };
    }
    if (norm.record_type === "FAM") {
      return {
        family_id: "",
        father_id: "",
        mother_id: "",
        union_date: norm.birth_date_iso,
        union_date_qual: norm.birth_date_qual
      };
    }
    if (norm.record_type === "SOUR") {
      return {
        source_id: "",
        title: norm.title_norm || norm.surname_norm || norm.given_norm,
        author: "",
        source_type: "",
        notes: ""
      };
    }
    if (norm.record_type === "PLAC") {
      return {
        place_id: norm.birth_place_id || "",
        place_name: norm.birth_place_norm || norm.death_place_norm || "",
        parent_id: "",
        notes: ""
      };
    }
    return {
      media_id: "",
      entity_type: "GEDCOM",
      entity_id: norm.gedcom_xref,
      filename: "",
      is_vector: "N"
    };
  }

  function fillBlanks(target, source) {
    Object.keys(source).forEach(function (k) {
      if (target[k] === "" || target[k] == null) {
        target[k] = source[k];
      }
    });
    return target;
  }

  function createImportLogEntry(sessionId, norm, conflict, decision, stageStats) {
    return {
      log_id: "GIL" + now14() + "-" + norm.pipeline_id.slice(-5),
      import_session: sessionId,
      pipeline_id: norm.pipeline_id,
      gedcom_xref: norm.gedcom_xref,
      record_type: norm.record_type,
      final_db_id: "",
      stages: {
        s1_status: "K",
        s1_tokens: stageStats && stageStats.s1_tokens || 0,
        s2_status: "K",
        s2_warnings: stageStats && stageStats.s2_warnings || 0,
        s3_status: norm.norm_status || "K",
        s3_norm_count: norm.norm_details ? norm.norm_details.length : 0,
        s3_conf_avg: Math.round((norm.surname_conf + norm.given_conf + norm.birth_date_conf + norm.birth_place_conf) / 4),
        s4_conflict: conflict && conflict.severity !== "NONE" ? "Y" : "N",
        s4_severity: conflict ? conflict.severity : "NONE",
        s5_decision: decision,
        s6_written: "N"
      },
      norm_details: norm.norm_details || [],
      norm_detail_cnt: (norm.norm_details || []).length,
      tags_found: [],
      tag_count: 0,
      tags_unmapped: [],
      unmapped_count: 0,
      batch_results: [],
      log_ts: now14(),
      log_closed: false
    };
  }

  function write(payload) {
    var sessionId = payload.sessionId;
    var normRecords = payload.normRecords || [];
    var conflicts = payload.conflicts || [];
    var decisions = payload.decisions || {};
    var dryRun = !!payload.dryRun;
    var strict = !!payload.strict;

    var tables = clone(payload.tables || {});
    tables.IMPORT_LOG = tables.IMPORT_LOG || [];
    tables.IMPORT_PENDING = tables.IMPORT_PENDING || [];
    tables.IMPORT_ARCHIVE = tables.IMPORT_ARCHIVE || [];

    var written = 0;
    var merged = 0;
    var skipped = 0;

    normRecords.forEach(function (norm) {
      var table = tableFromType(norm.record_type);
      tables[table] = tables[table] || [];
      var existingRows = tables[table];
      var c = (conflicts || []).find(function (x) { return x.pipeline_id === norm.pipeline_id; }) || null;
      var decision = decisions[norm.pipeline_id] || (c ? c.resolution : "ACCEPT_NEW");
      if (decision === "PENDING") {
        decision = "SKIP";
      }
      var log = createImportLogEntry(sessionId, norm, c, decision, payload.stageStats);

      if (dryRun) {
        log.stages.s6_written = "N";
        tables.IMPORT_LOG.push(log);
        skipped += 1;
        return;
      }

      if (decision === "ACCEPT_NEW") {
        var rec = toDbRecord(norm);
        var field = idField(table);
        rec[field] = nextId(table, existingRows);
        existingRows.push(rec);
        written += 1;
        log.final_db_id = rec[field];
        log.stages.s6_written = "Y";
      } else if (decision === "KEEP_EXIST") {
        skipped += 1;
        log.stages.s6_written = "N";
      } else if (decision === "MERGE") {
        if (c && c.existing_id) {
          var idf = idField(table);
          var idx = existingRows.findIndex(function (r) { return r[idf] === c.existing_id; });
          if (idx >= 0) {
            tables.IMPORT_ARCHIVE.push({ table: table, old_record: clone(existingRows[idx]), ts: now14() });
            var mergedRec = fillBlanks(existingRows[idx], toDbRecord(norm));
            existingRows[idx] = mergedRec;
            merged += 1;
            log.final_db_id = c.existing_id;
            log.stages.s6_written = "Y";
          } else {
            skipped += 1;
            log.stages.s6_written = "N";
          }
        } else {
          skipped += 1;
          log.stages.s6_written = "N";
        }
      } else if (decision === "SKIP") {
        tables.IMPORT_PENDING.push({
          session_id: sessionId,
          pipeline_id: norm.pipeline_id,
          gedcom_xref: norm.gedcom_xref,
          record_type: norm.record_type,
          reason: "SKIP",
          ts: now14()
        });
        skipped += 1;
        log.stages.s6_written = "N";
      }

      tables.IMPORT_LOG.push(log);
    });

    if (!dryRun) {
      GN370.DB_ENGINE.populate(tables, {
        source: "GEDCOM_IMPORT",
        imported_at: new Date().toISOString(),
        import_session: sessionId
      });
    }

    if (strict && !dryRun) {
      var val = GN370.VALIDATE.run(tables);
      if (val.errors && val.errors.length > 0) {
        var err = new Error("STRICT_MODE_VALIDATION_FAILED");
        err.exitCode = 12;
        throw err;
      }
    }

    return {
      tables: tables,
      logs: tables.IMPORT_LOG,
      stats: {
        written: written,
        merged: merged,
        skipped: skipped,
        total: normRecords.length
      }
    };
  }

  GN370.IMPORT.dbWriter = {
    write: write
  };
}(window));
