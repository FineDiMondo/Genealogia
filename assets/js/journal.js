(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  var journalRows = [];
  var preImport = [];

  function createEntry(opType, entityType, entityId, description) {
    return {
      journal_id: "GNJ" + String(journalRows.length + preImport.length + 1).padStart(9, "0"),
      entry_ts: new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14),
      op_type: opType || "INFO",
      entity_type: entityType || "-",
      entity_id: entityId || "-",
      description: description || "",
      operator: "GN370",
      session_id: "WEB"
    };
  }

  function entry(opType, entityType, entityId, description) {
    var row = createEntry(opType, entityType, entityId, description);
    if (GN370.STATE && GN370.STATE.getStatus() === "READY") {
      journalRows.push(row);
    } else {
      preImport.push(row);
    }
    return row;
  }

  function flushPreImportLog() {
    if (preImport.length) {
      journalRows = journalRows.concat(preImport);
      preImport = [];
    }
  }

  function tail(n) {
    var count = n || 10;
    return journalRows.slice(-count);
  }

  function grep(pattern) {
    var p = String(pattern || "").toLowerCase();
    return journalRows.filter(function (r) {
      return JSON.stringify(r).toLowerCase().indexOf(p) >= 0;
    });
  }

  GN370.JOURNAL = {
    entry: entry,
    flushPreImportLog: flushPreImportLog,
    tail: tail,
    grep: grep,
    all: function () { return journalRows.slice(); },
    update: function () { throw new Error("JOURNAL_APPEND_ONLY"); },
    remove: function () { throw new Error("JOURNAL_APPEND_ONLY"); },
    reset: function () { journalRows = []; preImport = []; }
  };
}(window));
