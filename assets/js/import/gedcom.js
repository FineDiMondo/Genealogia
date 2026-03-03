(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  GN370.IMPORT = GN370.IMPORT || {};

  var SESSION_STATE = {
    lastSession: null,
    pendingConflicts: [],
    pendingCorrelations: []
  };

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function mkSessionId() {
    return "GED" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  }

  function mapNormToCompatTables(normRecords) {
    var tables = {
      PERSON: [],
      FAMILY: [],
      SOURCE: [],
      PLACE: [],
      MEDIA: []
    };
    (normRecords || []).forEach(function (n, idx) {
      if (n.record_type === "INDI") {
        tables.PERSON.push({
          person_id: "GNP" + String(idx + 1).padStart(9, "0"),
          gedcom_id: n.gedcom_xref,
          surname: n.surname_norm,
          given_name: n.given_norm,
          birth_date: n.birth_date_iso,
          death_date: n.death_date_iso
        });
      } else if (n.record_type === "FAM") {
        tables.FAMILY.push({
          family_id: "GNF" + String(idx + 1).padStart(9, "0"),
          union_date: n.birth_date_iso
        });
      } else if (n.record_type === "SOUR") {
        tables.SOURCE.push({
          source_id: "GNS" + String(idx + 1).padStart(9, "0"),
          title: n.title_norm
        });
      } else if (n.record_type === "PLAC") {
        tables.PLACE.push({
          place_id: n.birth_place_id,
          place_name: n.birth_place_norm
        });
      } else if (n.record_type === "OBJE") {
        tables.MEDIA.push({
          media_id: "GNM" + String(idx + 1).padStart(9, "0"),
          entity_type: "GEDCOM",
          entity_id: n.gedcom_xref
        });
      }
    });
    return tables;
  }

  function runBatchPipeline(tables, options) {
    var logs = tables.IMPORT_LOG || [];
    var ic = GN370.IMPORT.batchAgtIC.run(tables, logs);
    var norm2 = GN370.IMPORT.batchAgtNorm2.run(tables, logs);
    var corr = GN370.IMPORT.batchAgtCorr.run(tables, logs);
    if (options && options.strict && ic.findings.some(function (f) { return f.severity === "ERR"; })) {
      var err = new Error("STRICT_MODE_IC_FAILED");
      err.exitCode = 12;
      throw err;
    }
    return { ic: ic, norm2: norm2, corr: corr };
  }

  function startFromText(text, options) {
    var opts = options || {};
    var sessionId = mkSessionId();
    var tokenized = GN370.IMPORT.gedcomTokenizer.tokenize(text);
    var mapped = GN370.IMPORT.gedcomMapper.map(tokenized, { sessionId: sessionId });
    var normalized = GN370.IMPORT.normAgent.normalize(mapped.records);

    var existingTables = GN370.STATE.getStatus() === "READY"
      ? clone(GN370.DB_ENGINE.dump().tables)
      : {};

    var detected = GN370.IMPORT.conflictDetect.detectAll(normalized.records, existingTables);
    var resolved = GN370.IMPORT.conflictUI.resolve(detected.reports, {
      autoSkipLow: !!opts.autoSkipLow,
      forceAccept: !!opts.dryRun
    });
    var written = GN370.IMPORT.dbWriter.write({
      sessionId: sessionId,
      normRecords: normalized.records,
      conflicts: detected.reports,
      decisions: resolved.decisions,
      tables: existingTables,
      dryRun: !!opts.dryRun,
      strict: false,
      stageStats: {
        s1_tokens: tokenized.stats.total,
        s2_warnings: mapped.stats.warnings
      }
    });

    var batch = null;
    if (!opts.dryRun) {
      var current = GN370.DB_ENGINE.dump().tables;
      batch = runBatchPipeline(current, opts);
      GN370.DB_ENGINE.populate(current, {
        source: "GEDCOM_IMPORT_PIPELINE",
        imported_at: new Date().toISOString(),
        import_session: sessionId
      });
    }

    SESSION_STATE.pendingConflicts = resolved.pending;
    SESSION_STATE.pendingCorrelations = !opts.dryRun
      ? (GN370.DB_ENGINE.dump().tables.CORRELATION_PENDING || [])
      : [];
    SESSION_STATE.lastSession = {
      session_id: sessionId,
      options: opts,
      stage_stats: {
        s1_tokens: tokenized.stats.total,
        s2_records: mapped.stats.count,
        s3_norm_count: normalized.stats.norm_count,
        s4_conflicts: detected.reports.filter(function (r) { return r.severity !== "NONE"; }).length,
        s5_pending: resolved.pending.length,
        s6_written: written.stats.written,
        s6_merged: written.stats.merged,
        s6_skipped: written.stats.skipped,
        s7_ran: !opts.dryRun
      },
      tokenized: tokenized.stats,
      mapped: mapped.stats,
      normalized: normalized.stats,
      conflict_stats: detected.stats,
      writer_stats: written.stats,
      batch: batch,
      panel: resolved.panel
    };

    if (GN370.JOURNAL) {
      GN370.JOURNAL.entry("IMPORT_GEDCOM_PIPELINE", "IMPORT_LOG", sessionId, "GEDCOM S1-S7 completed");
    }

    return SESSION_STATE.lastSession;
  }

  function start(file, options) {
    return file.text().then(function (text) {
      return startFromText(text, options);
    });
  }

  function status() {
    return SESSION_STATE.lastSession;
  }

  function listLogs(opts) {
    var options = opts || {};
    if (GN370.STATE.getStatus() !== "READY") {
      return [];
    }
    var logs = GN370.DB_ENGINE.query("IMPORT_LOG");
    if (options.recordId) {
      return logs.filter(function (l) { return l.pipeline_id === options.recordId || l.gedcom_xref === options.recordId; });
    }
    if (options.n) {
      return logs.slice(-Number(options.n));
    }
    return logs;
  }

  function listConflicts() {
    return clone(SESSION_STATE.pendingConflicts || []);
  }

  function listCorrelations() {
    if (GN370.STATE.getStatus() !== "READY") {
      return [];
    }
    var rows = GN370.DB_ENGINE.query("CORRELATION_PENDING");
    return rows;
  }

  function reviewCorrelation(corrId) {
    var rows = listCorrelations();
    return rows.find(function (r) { return r.corr_id === corrId; }) || null;
  }

  function acceptCorrelation(corrId) {
    if (GN370.STATE.getStatus() !== "READY") {
      var e = new Error("DB_NOT_READY");
      e.exitCode = 2;
      throw e;
    }
    var dump = GN370.DB_ENGINE.dump();
    dump.tables.CORRELATION_PENDING = dump.tables.CORRELATION_PENDING || [];
    var idx = dump.tables.CORRELATION_PENDING.findIndex(function (r) { return r.corr_id === corrId; });
    if (idx < 0) {
      return false;
    }
    dump.tables.CORRELATION_PENDING[idx].status = "ACCEPTED";
    GN370.DB_ENGINE.populate(dump.tables, dump.meta || {});
    return true;
  }

  function rerunBatch() {
    if (GN370.STATE.getStatus() !== "READY") {
      var e = new Error("DB_NOT_READY");
      e.exitCode = 2;
      throw e;
    }
    var dump = GN370.DB_ENGINE.dump();
    var batch = runBatchPipeline(dump.tables, { strict: false });
    GN370.DB_ENGINE.populate(dump.tables, dump.meta || {});
    SESSION_STATE.pendingCorrelations = dump.tables.CORRELATION_PENDING || [];
    return batch;
  }

  GN370.GEDCOM = {
    start: start,
    startFromText: startFromText,
    status: status,
    importLog: listLogs,
    conflicts: listConflicts,
    correlations: listCorrelations,
    reviewCorrelation: reviewCorrelation,
    acceptCorrelation: acceptCorrelation,
    rerunBatch: rerunBatch
  };

  // Compatibility layer for legacy calls/tests.
  GN370.IMPORT.gedcom = {
    mapGedcomDate: GN370.IMPORT.normAgent.mapGedcomDate,
    parse: function (text) {
      var tokenized = GN370.IMPORT.gedcomTokenizer.tokenize(text);
      var mapped = GN370.IMPORT.gedcomMapper.map(tokenized, { sessionId: "COMPAT" });
      var normalized = GN370.IMPORT.normAgent.normalize(mapped.records);
      return mapNormToCompatTables(normalized.records);
    },
    importFile: function (file, options) {
      return start(file, options || {});
    }
  };
}(window));
