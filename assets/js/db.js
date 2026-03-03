(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};

  var memory = {
    tables: {},
    indexes: {},
    meta: {},
    cache: {},
    jobs: [],
    feed: [],
    errors: []
  };
  var STORAGE_PREFIXES = ["GN370", "gn370"];

  function gate() {
    if (!GN370.STATE || GN370.STATE.getStatus() !== "READY") {
      var err = new Error("DB_NOT_READY");
      err.exitCode = 2;
      throw err;
    }
  }

  function syncStatusLabel() {
    var el = document.getElementById("gn370-status");
    if (el && GN370.STATE) {
      el.textContent = "DB: " + GN370.STATE.getStatus();
    }
  }

  function recreateSqlRuntime(reason) {
    if (!GN370.SQL_RUNTIME || typeof GN370.SQL_RUNTIME.recreate !== "function") {
      return;
    }
    Promise.resolve(GN370.SQL_RUNTIME.recreate()).then(function () {
      if (GN370.JOURNAL) {
        GN370.JOURNAL.entry("SQL_RESET", "DB", "-", "SQL runtime recreated (" + (reason || "n/a") + ")");
      }
    }).catch(function (e) {
      if (GN370.JOURNAL) {
        GN370.JOURNAL.entry("SQL_RESET_ERR", "DB", "-", String(e && e.message ? e.message : e));
      }
    });
  }

  function syncSqlRuntime(reason, source) {
    if (!GN370.SQL_RUNTIME || typeof GN370.SQL_RUNTIME.syncTables !== "function") {
      return;
    }
    Promise.resolve(GN370.SQL_RUNTIME.syncTables(memory.tables, {
      reason: reason || "SYNC",
      source: source || "GN370.DB_ENGINE",
      importId: memory.meta && memory.meta.import_session ? memory.meta.import_session : null
    })).then(function () {
      if (GN370.JOURNAL) {
        GN370.JOURNAL.entry("SQL_SYNC", "DB", "-", "SQL sync ok (" + (reason || "n/a") + ")");
      }
    }).catch(function (e) {
      if (GN370.JOURNAL) {
        GN370.JOURNAL.entry("SQL_SYNC_ERR", "DB", "-", String(e && e.message ? e.message : e));
      }
    });
  }

  function clearStorageForPrefixes(storage, prefixes) {
    if (!storage || !storage.length) {
      return;
    }
    var keys = [];
    for (var i = 0; i < storage.length; i += 1) {
      keys.push(storage.key(i));
    }
    keys.forEach(function (k) {
      if (!k) {
        return;
      }
      var shouldRemove = prefixes.some(function (prefix) {
        return k.indexOf(prefix) === 0;
      });
      if (shouldRemove) {
        storage.removeItem(k);
      }
    });
  }

  function resetMemory() {
    memory.tables = {};
    memory.indexes = {};
    memory.meta = {};
    memory.cache = {};
    memory.jobs = [];
    memory.feed = [];
    memory.errors = [];
    if (GN370.STATE) {
      GN370.STATE.resetAll();
    }
    if (GN370.JOURNAL) {
      GN370.JOURNAL.reset();
      GN370.JOURNAL.entry("RESET", "SYSTEM", "-", "Memory reset hard");
    }
    try {
      clearStorageForPrefixes(global.localStorage, STORAGE_PREFIXES);
      clearStorageForPrefixes(global.sessionStorage, STORAGE_PREFIXES);
    } catch (_) { /* storage not available, ignore */ }
    recreateSqlRuntime("RESET_MEMORY");
    global.__GN370_MEM_STATUS = "CLEAN";
    global.__GN370_LAST_RESET_TS = new Date().toISOString();
    syncStatusLabel();
  }

  function normalizeTableName(name) {
    return String(name || "").toUpperCase();
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function buildIndexes() {
    memory.indexes = {};
    Object.keys(memory.tables).forEach(function (tableName) {
      var rows = memory.tables[tableName] || [];
      var index = {};
      rows.forEach(function (r, i) {
        var idField = Object.keys(r).find(function (k) { return /_id$/.test(k); });
        if (idField && r[idField]) {
          index[r[idField]] = i;
        }
      });
      memory.indexes[tableName] = index;
    });
  }

  function populate(tables, meta) {
    memory.tables = clone(tables || {});
    memory.meta = clone(meta || {});
    buildIndexes();
    syncSqlRuntime("POPULATE", memory.meta && memory.meta.source ? memory.meta.source : "populate");
    if (GN370.STATE) {
      GN370.STATE.transition("READY", "populate");
    }
    global.__GN370_DB_STATUS = "READY";
    if (GN370.JOURNAL) {
      GN370.JOURNAL.flushPreImportLog();
      GN370.JOURNAL.entry("IMPORT", "DB", "-", "Populate completed");
    }
    syncStatusLabel();
  }

  function mergeTables(newTables) {
    gate();
    Object.keys(newTables).forEach(function (name) {
      var t = normalizeTableName(name);
      memory.tables[t] = (memory.tables[t] || []).concat(newTables[name] || []);
    });
    buildIndexes();
    syncSqlRuntime("MERGE", "mergeTables");
    if (GN370.JOURNAL) {
      GN370.JOURNAL.entry("MERGE", "DB", "-", "Tables merged");
    }
  }

  function query(tableName, where) {
    gate();
    var t = normalizeTableName(tableName);
    var rows = memory.tables[t] || [];
    if (!where || typeof where !== "object") {
      return clone(rows);
    }
    return clone(rows.filter(function (row) {
      return Object.keys(where).every(function (k) { return row[k] === where[k]; });
    }));
  }

  function listTables() {
    gate();
    return Object.keys(memory.tables).sort().map(function (t) {
      return { table: t, rows: (memory.tables[t] || []).length };
    });
  }

  function parseTable(text) {
    var lines = String(text || "").split(/\r?\n/).filter(function (l) { return l.length > 0; });
    if (!lines.length) {
      return [];
    }
    var payload = lines.filter(function (line) {
      return line.indexOf("##TABLE=") !== 0 && line.indexOf("##CHECKSUM=") !== 0;
    });
    return payload.map(function (line) {
      try {
        return JSON.parse(line);
      } catch (_) {
        return { raw: line };
      }
    });
  }

  async function sha256Hex(input) {
    var data = new TextEncoder().encode(input);
    var hash = await crypto.subtle.digest("SHA-256", data);
    var bytes = Array.from(new Uint8Array(hash));
    return bytes.map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  async function serializeTable(tableName, rows) {
    var created = nowAAAAGGMMHHMM();
    var body = (rows || []).map(function (r) { return JSON.stringify(r); }).join("\n");
    var checksum = await sha256Hex(body);
    var header = "##TABLE=" + tableName + "|SCHEMA=2.0|COLS=0|CREATED=" + created;
    var footer = "##CHECKSUM=SHA256:" + checksum + "|ROWS=" + (rows || []).length;
    return header + "\n" + body + (body ? "\n" : "") + footer + "\n";
  }

  function nowAAAAGGMMHHMM() {
    var d = new Date();
    var y = String(d.getFullYear());
    var dd = String(d.getDate()).padStart(2, "0");
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var hh = String(d.getHours()).padStart(2, "0");
    var mi = String(d.getMinutes()).padStart(2, "0");
    return y + dd + mm + hh + mi;
  }

  async function commit() {
    gate();
    var zip = new JSZip();
    var tables = Object.keys(memory.tables).sort();
    for (var i = 0; i < tables.length; i += 1) {
      var t = tables[i];
      var content = await serializeTable(t, memory.tables[t]);
      zip.file("tables/" + t + ".table", content);
    }
    var ts = nowAAAAGGMMHHMM();
    var fileName = ts + ".zip";
    var blob = await zip.generateAsync({ type: "blob" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 2000);
    if (GN370.JOURNAL) {
      GN370.JOURNAL.entry("EXPORT", "DB", "-", "commit creato: " + fileName);
    }
    return fileName;
  }

  async function listZipEntries(file) {
    var zip = await JSZip.loadAsync(file);
    return Object.keys(zip.files).filter(function (k) {
      return !zip.files[k].dir && /\.table$/i.test(k);
    }).sort();
  }

  async function importZip(file, selectedEntries) {
    resetMemory();
    var zip = await JSZip.loadAsync(file);
    var entries = (selectedEntries && selectedEntries.length ? selectedEntries : Object.keys(zip.files)).filter(function (k) {
      return !zip.files[k].dir && /\.table$/i.test(k);
    });

    var tables = {};
    for (var i = 0; i < entries.length; i += 1) {
      var entry = entries[i];
      var text = await zip.file(entry).async("string");
      var base = entry.split("/").pop();
      var tableName = base.replace(/\.[^.]+$/, "").toUpperCase();
      tables[tableName] = parseTable(text);
    }

    populate(tables, { source: file.name || "user-zip", imported_at: new Date().toISOString() });
    return { tables: Object.keys(tables), status: GN370.STATE.getStatus() };
  }

  GN370.DB_ENGINE = {
    gate: gate,
    reset: resetMemory,
    populate: populate,
    merge: mergeTables,
    query: query,
    listTables: listTables,
    listZipEntries: listZipEntries,
    importZip: importZip,
    commit: commit,
    serializeTable: serializeTable,
    parseTable: parseTable,
    nowAAAAGGMMHHMM: nowAAAAGGMMHHMM,
    dump: function () { return clone(memory); },
    memoryStatus: function () {
      return {
        status: global.__GN370_MEM_STATUS || "DIRTY",
        last_reset_ts: global.__GN370_LAST_RESET_TS || null
      };
    }
  };
}(window));
