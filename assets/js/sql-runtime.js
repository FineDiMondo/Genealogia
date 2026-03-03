(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};

  var DEFAULT_SCHEMA_PATH = "db/schema.sql";
  var SQLITE_VENDOR_DIR = "/assets/vendor/sqlite/";
  var SQLITE_VENDOR_MODULE = SQLITE_VENDOR_DIR + "index.mjs";
  var SQLITE_DB_FILE = "/gn370.sqlite3";
  var FALLBACK_SCHEMA = [
    "CREATE TABLE IF NOT EXISTS GN370_TABLE_META (table_name TEXT PRIMARY KEY, row_count INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);",
    "CREATE TABLE IF NOT EXISTS GN370_ROW_STORE (table_name TEXT NOT NULL, row_seq INTEGER NOT NULL, row_id TEXT, payload_json TEXT NOT NULL, PRIMARY KEY (table_name, row_seq));",
    "CREATE TABLE IF NOT EXISTS GN370_PERSON (person_id TEXT PRIMARY KEY, gedcom_id TEXT, surname TEXT, given_name TEXT, gender TEXT, birth_date TEXT, birth_qual TEXT, birth_cal TEXT, birth_place TEXT, death_date TEXT, death_qual TEXT, death_cal TEXT, death_place TEXT, notes TEXT);",
    "CREATE TABLE IF NOT EXISTS GN370_FAMILY (family_id TEXT PRIMARY KEY, father_id TEXT, mother_id TEXT, union_date TEXT, union_date_qual TEXT, notes TEXT);",
    "CREATE TABLE IF NOT EXISTS GN370_PLACE (place_id TEXT PRIMARY KEY, place_name TEXT, parent_id TEXT, notes TEXT);",
    "CREATE TABLE IF NOT EXISTS GN370_SOURCE (source_id TEXT PRIMARY KEY, title TEXT, author TEXT, source_type TEXT, notes TEXT);",
    "CREATE TABLE IF NOT EXISTS GN370_EVENT (event_id TEXT PRIMARY KEY, person_id TEXT, family_id TEXT, event_type TEXT, event_date TEXT, event_date_qual TEXT, place_id TEXT, source_id TEXT, note TEXT);",
    "CREATE TABLE IF NOT EXISTS GN370_CITATION (citation_id TEXT PRIMARY KEY, source_id TEXT, person_id TEXT, family_id TEXT, event_id TEXT, page TEXT, note TEXT);",
    "CREATE TABLE IF NOT EXISTS GN370_IMPORT_AUDIT (import_id TEXT PRIMARY KEY, source_label TEXT NOT NULL, imported_at TEXT NOT NULL, records_total INTEGER NOT NULL DEFAULT 0);",
    "CREATE TABLE IF NOT EXISTS GN370_IMPORT_FAMILY_LOG (family_key TEXT NOT NULL, log_ts TEXT NOT NULL, import_session TEXT NOT NULL, pipeline_id TEXT NOT NULL, record_type TEXT NOT NULL, gedcom_xref TEXT, final_db_id TEXT, decision TEXT, ai_applied TEXT, ai_conf INTEGER, ai_reason TEXT, norm_payload_json TEXT, PRIMARY KEY (family_key, log_ts, pipeline_id));",
    "CREATE INDEX IF NOT EXISTS IDX_GN370_IMPORT_FAMILY_LOG_FAMILY ON GN370_IMPORT_FAMILY_LOG (family_key, log_ts);",
    "CREATE INDEX IF NOT EXISTS IDX_GN370_IMPORT_FAMILY_LOG_SESSION ON GN370_IMPORT_FAMILY_LOG (import_session);"
  ].join("\n");

  var CORE_TYPED_MIRROR = [
    {
      source_table: "PERSON",
      target_table: "GN370_PERSON",
      columns: ["person_id", "gedcom_id", "surname", "given_name", "gender", "birth_date", "birth_qual", "birth_cal", "birth_place", "death_date", "death_qual", "death_cal", "death_place", "notes"]
    },
    {
      source_table: "FAMILY",
      target_table: "GN370_FAMILY",
      columns: ["family_id", "father_id", "mother_id", "union_date", "union_date_qual", "notes"]
    },
    {
      source_table: "PLACE",
      target_table: "GN370_PLACE",
      columns: ["place_id", "place_name", "parent_id", "notes"]
    },
    {
      source_table: "SOURCE",
      target_table: "GN370_SOURCE",
      columns: ["source_id", "title", "author", "source_type", "notes"]
    },
    {
      source_table: "EVENT",
      target_table: "GN370_EVENT",
      columns: ["event_id", "person_id", "family_id", "event_type", "event_date", "event_date_qual", "place_id", "source_id", "note"]
    },
    {
      source_table: "CITATION",
      target_table: "GN370_CITATION",
      columns: ["citation_id", "source_id", "person_id", "family_id", "event_id", "page", "note"]
    },
    {
      source_table: "IMPORT_LOG_FAMILY",
      target_table: "GN370_IMPORT_FAMILY_LOG",
      columns: ["family_key", "log_ts", "import_session", "pipeline_id", "record_type", "gedcom_xref", "final_db_id", "decision", "ai_applied", "ai_conf", "ai_reason", "norm_payload_json"]
    }
  ];

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function qid(name) {
    return "\"" + String(name || "").replace(/"/g, "\"\"") + "\"";
  }

  function findRowId(row) {
    if (!row || typeof row !== "object") {
      return null;
    }
    var keys = Object.keys(row);
    for (var i = 0; i < keys.length; i += 1) {
      if (/_id$/i.test(keys[i]) && row[keys[i]]) {
        return String(row[keys[i]]);
      }
    }
    return null;
  }

  function rowTotal(tables) {
    return Object.keys(tables || {}).reduce(function (acc, t) {
      var rows = tables[t];
      return acc + (Array.isArray(rows) ? rows.length : 0);
    }, 0);
  }

  function normalizeSqlValue(v) {
    if (v == null || v === undefined) {
      return null;
    }
    if (typeof v === "object") {
      return JSON.stringify(v);
    }
    if (typeof v === "number" || typeof v === "boolean") {
      return String(v);
    }
    return v;
  }

  function getTypedRows(tables, sourceTable) {
    var rows = tables && tables[sourceTable];
    return Array.isArray(rows) ? rows : [];
  }

  function buildTypedInsertSql(def, placeholders) {
    return "INSERT OR REPLACE INTO " + qid(def.target_table) + "(" + def.columns.map(qid).join(",") + ") VALUES(" + placeholders.join(",") + ")";
  }

  function buildWasmPlaceholders(count) {
    var out = [];
    for (var i = 0; i < count; i += 1) {
      out.push("?");
    }
    return out;
  }

  function buildWorkerPlaceholders(count) {
    var out = [];
    for (var i = 1; i <= count; i += 1) {
      out.push("?" + String(i));
    }
    return out;
  }

  function typedBindRow(def, row) {
    return def.columns.map(function (col) {
      return normalizeSqlValue(row && Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null);
    });
  }

  function typedMirrorMeta(tables, updatedAt) {
    return CORE_TYPED_MIRROR.map(function (def) {
      return {
        table_name: def.target_table,
        source_table: def.source_table,
        row_count: getTypedRows(tables, def.source_table).length,
        updated_at: updatedAt || null
      };
    });
  }

  var state = {
    initialized: false,
    mode: "UNINITIALIZED",
    schemaPath: DEFAULT_SCHEMA_PATH,
    schemaText: FALLBACK_SCHEMA,
    syncCount: 0,
    lastSyncAt: null,
    adapter: null,
    lastError: null,
    sqliteVersion: null,
    opfsUsed: false,
    opfsError: null
  };

  function rememberError(err) {
    state.lastError = err && err.message ? err.message : String(err);
  }

  function createMemoryShimAdapter() {
    var shadow = {
      tables: {},
      meta: {},
      audit: [],
      typed_meta: []
    };

    return {
      mode: "MEMORY_SHIM",
      recreate: function (schemaText) {
        shadow.tables = {};
        shadow.meta = {
          schema_loaded: !!schemaText,
          reset_at: nowIso()
        };
        shadow.audit = [];
        shadow.typed_meta = [];
      },
      syncTables: function (tables, opts) {
        var src = tables || {};
        var now = nowIso();
        shadow.tables = clone(src);
        shadow.meta = {
          reason: opts && opts.reason ? opts.reason : "SYNC",
          synced_at: now,
          table_count: Object.keys(src).length
        };
        shadow.typed_meta = typedMirrorMeta(src, now);
      },
      dump: function () {
        return clone(shadow);
      }
    };
  }

  async function ensureSqliteInitializer() {
    if (typeof global.sqlite3InitModule === "function") {
      return global.sqlite3InitModule;
    }

    try {
      var cacheBuster = global.__GN370_BUILD_TS || "";
      var moduleUrl = SQLITE_VENDOR_MODULE + (cacheBuster ? ("?v=" + encodeURIComponent(cacheBuster)) : "");
      var mod = await import(moduleUrl);
      if (mod && typeof mod.default === "function") {
        global.sqlite3InitModule = mod.default;
      }
      if (mod && typeof mod.sqlite3Worker1Promiser === "function") {
        global.sqlite3Worker1Promiser = mod.sqlite3Worker1Promiser;
      }
    } catch (e) {
      rememberError(e);
      return null;
    }

    return typeof global.sqlite3InitModule === "function" ? global.sqlite3InitModule : null;
  }

  async function readSchema(schemaPath) {
    try {
      var resp = await fetch(schemaPath, { cache: "no-store" });
      if (!resp.ok) {
        throw new Error("SCHEMA_FETCH_FAILED");
      }
      var text = await resp.text();
      return text && text.trim() ? text : FALLBACK_SCHEMA;
    } catch (_) {
      return FALLBACK_SCHEMA;
    }
  }

  function dropAllUserSchema(db) {
    var objects = [];
    db.exec({
      sql: "SELECT type,name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'trigger' THEN 0 WHEN 'view' THEN 1 WHEN 'table' THEN 2 WHEN 'index' THEN 3 ELSE 4 END",
      rowMode: "object",
      resultRows: objects
    });

    for (var i = 0; i < objects.length; i += 1) {
      var obj = objects[i];
      var t = String(obj.type || "").toLowerCase();
      var n = obj.name;
      if (!n) {
        continue;
      }
      if (t === "trigger") {
        db.exec("DROP TRIGGER IF EXISTS " + qid(n));
      } else if (t === "view") {
        db.exec("DROP VIEW IF EXISTS " + qid(n));
      } else if (t === "table") {
        db.exec("DROP TABLE IF EXISTS " + qid(n));
      } else if (t === "index") {
        db.exec("DROP INDEX IF EXISTS " + qid(n));
      }
    }
  }

  async function createWorkerOpfsAdapter(schemaText) {
    await ensureSqliteInitializer();
    if (typeof global.sqlite3Worker1Promiser !== "function") {
      return null;
    }

    try {
      var promiser = await new Promise(function (resolve, reject) {
        try {
          var instance = global.sqlite3Worker1Promiser({
            onready: function () {
              resolve(instance);
            },
            onerror: function (e) {
              reject(e);
            }
          });
        } catch (e) {
          reject(e);
        }
      });

      var cfg = null;
      try {
        cfg = await promiser("config-get", {});
      } catch (_) {}

      var open = await promiser("open", {
        filename: "file:gn370.sqlite3?vfs=opfs"
      });
      var dbId = open.dbId;
      var tableMeta = [];
      var importAudit = [];
      var typedMeta = [];

      async function exec(sql, bind) {
        var msg = { dbId: dbId, sql: sql };
        if (Array.isArray(bind)) {
          msg.bind = bind;
        }
        return promiser("exec", msg);
      }

      async function queryObjects(sql) {
        var rows = [];
        await promiser("exec", {
          dbId: dbId,
          sql: sql,
          rowMode: "object",
          callback: function (msg) {
            if (msg && msg.rowNumber !== null && msg.row) {
              rows.push(msg.row);
            }
          }
        });
        return rows;
      }

      async function dropWorkerSchema() {
        var objects = await queryObjects("SELECT type,name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'trigger' THEN 0 WHEN 'view' THEN 1 WHEN 'table' THEN 2 WHEN 'index' THEN 3 ELSE 4 END");
        for (var i = 0; i < objects.length; i += 1) {
          var obj = objects[i] || {};
          var t = String(obj.type || "").toLowerCase();
          var n = obj.name;
          if (!n) {
            continue;
          }
          if (t === "trigger") {
            await exec("DROP TRIGGER IF EXISTS " + qid(n));
          } else if (t === "view") {
            await exec("DROP VIEW IF EXISTS " + qid(n));
          } else if (t === "table") {
            await exec("DROP TABLE IF EXISTS " + qid(n));
          } else if (t === "index") {
            await exec("DROP INDEX IF EXISTS " + qid(n));
          }
        }
      }

      async function recreateSchema(nextSchema) {
        await dropWorkerSchema();
        await exec(nextSchema || schemaText || FALLBACK_SCHEMA);
        tableMeta = [];
        typedMeta = [];
      }

      await recreateSchema(schemaText);

      state.sqliteVersion = cfg && cfg.result && cfg.result.version ? cfg.result.version.libVersion : null;
      state.opfsUsed = true;
      state.opfsError = null;

      return {
        mode: "SQLITE_WASM_OPFS",
        recreate: function (nextSchema) {
          return recreateSchema(nextSchema);
        },
        syncTables: async function (tables, opts) {
          var src = tables || {};
          var tableNames = Object.keys(src).sort();
          var importedRows = rowTotal(src);
          var now = nowIso();

          await exec("DELETE FROM GN370_ROW_STORE");
          await exec("DELETE FROM GN370_TABLE_META");
          for (var t = 0; t < CORE_TYPED_MIRROR.length; t += 1) {
            await exec("DELETE FROM " + qid(CORE_TYPED_MIRROR[t].target_table));
          }

          for (var i = 0; i < tableNames.length; i += 1) {
            var tableName = tableNames[i];
            var rows = Array.isArray(src[tableName]) ? src[tableName] : [];
            for (var j = 0; j < rows.length; j += 1) {
              await exec(
                "INSERT INTO GN370_ROW_STORE(table_name,row_seq,row_id,payload_json) VALUES(?1,?2,?3,?4)",
                [tableName, j, findRowId(rows[j]), JSON.stringify(rows[j])]
              );
            }
            await exec(
              "INSERT INTO GN370_TABLE_META(table_name,row_count,updated_at) VALUES(?1,?2,?3)",
              [tableName, rows.length, now]
            );
          }

          for (var m = 0; m < CORE_TYPED_MIRROR.length; m += 1) {
            var def = CORE_TYPED_MIRROR[m];
            var sourceRows = getTypedRows(src, def.source_table);
            if (!sourceRows.length) {
              continue;
            }
            var insertSql = buildTypedInsertSql(def, buildWorkerPlaceholders(def.columns.length));
            for (var r = 0; r < sourceRows.length; r += 1) {
              await exec(insertSql, typedBindRow(def, sourceRows[r]));
            }
          }

          if (opts && opts.importId) {
            await exec(
              "INSERT OR REPLACE INTO GN370_IMPORT_AUDIT(import_id,source_label,imported_at,records_total) VALUES(?1,?2,?3,?4)",
              [String(opts.importId), String(opts.source || "GN370"), now, importedRows]
            );
            importAudit.unshift({
              import_id: String(opts.importId),
              source_label: String(opts.source || "GN370"),
              imported_at: now,
              records_total: importedRows
            });
            if (importAudit.length > 25) {
              importAudit = importAudit.slice(0, 25);
            }
          }

          tableMeta = tableNames.map(function (t) {
            return {
              table_name: t,
              row_count: (src[t] || []).length,
              updated_at: now
            };
          });
          typedMeta = typedMirrorMeta(src, now);
        },
        dump: function () {
          return {
            mode: "SQLITE_WASM_OPFS",
            sqlite_version: state.sqliteVersion,
            opfs_used: true,
            opfs_error: null,
            table_meta: clone(tableMeta),
            import_audit: clone(importAudit),
            typed_meta: clone(typedMeta)
          };
        }
      };
    } catch (e) {
      state.opfsUsed = false;
      state.opfsError = e && e.message ? e.message : String(e);
      return null;
    }
  }

  async function createWasmSqliteAdapter(schemaText) {
    var initModule = await ensureSqliteInitializer();
    if (!initModule) {
      return null;
    }

    try {
      var sqlite3 = await initModule({
        locateFile: function (fileName) {
          return SQLITE_VENDOR_DIR + fileName;
        },
        print: function () {},
        printErr: function () {}
      });

      if (!sqlite3 || !sqlite3.oo1 || typeof sqlite3.oo1.DB !== "function") {
        return null;
      }

      var db = null;
      var opfsEnabled = false;
      var opfsInitError = null;
      var typedMeta = [];

      function openDb() {
        if (db) {
          try {
            db.close();
          } catch (_) {}
          db = null;
        }

        if (sqlite3.oo1 && typeof sqlite3.oo1.OpfsDb === "function") {
          try {
            db = new sqlite3.oo1.OpfsDb(SQLITE_DB_FILE, "c");
            opfsEnabled = true;
            opfsInitError = null;
          } catch (e) {
            opfsEnabled = false;
            opfsInitError = e && e.message ? e.message : String(e);
          }
        }

        if (!db) {
          db = new sqlite3.oo1.DB(SQLITE_DB_FILE, "ct");
        }

        dropAllUserSchema(db);
        db.exec(schemaText || FALLBACK_SCHEMA);
        typedMeta = [];
      }

      function execBind(sql, bind) {
        db.exec({
          sql: sql,
          bind: bind
        });
      }

      openDb();

      state.sqliteVersion = sqlite3.version && sqlite3.version.libVersion ? sqlite3.version.libVersion : null;
      state.opfsUsed = opfsEnabled;
      state.opfsError = opfsInitError;

      return {
        mode: opfsEnabled ? "SQLITE_WASM_OPFS" : "SQLITE_WASM",
        recreate: function (nextSchema) {
          openDb();
          if (nextSchema && nextSchema.trim()) {
            dropAllUserSchema(db);
            db.exec(nextSchema);
          }
        },
        syncTables: function (tables, opts) {
          var src = tables || {};
          var tableNames = Object.keys(src).sort();
          var importedRows = rowTotal(src);
          var now = nowIso();

          db.exec("DELETE FROM GN370_ROW_STORE");
          db.exec("DELETE FROM GN370_TABLE_META");
          for (var td = 0; td < CORE_TYPED_MIRROR.length; td += 1) {
            db.exec("DELETE FROM " + qid(CORE_TYPED_MIRROR[td].target_table));
          }

          db.exec("BEGIN");
          try {
            for (var i = 0; i < tableNames.length; i += 1) {
              var tableName = tableNames[i];
              var rows = Array.isArray(src[tableName]) ? src[tableName] : [];
              for (var j = 0; j < rows.length; j += 1) {
                execBind(
                  "INSERT INTO GN370_ROW_STORE(table_name,row_seq,row_id,payload_json) VALUES(?,?,?,?)",
                  [tableName, j, findRowId(rows[j]), JSON.stringify(rows[j])]
                );
              }
              execBind(
                "INSERT INTO GN370_TABLE_META(table_name,row_count,updated_at) VALUES(?,?,?)",
                [tableName, rows.length, now]
              );
            }
            for (var m = 0; m < CORE_TYPED_MIRROR.length; m += 1) {
              var def = CORE_TYPED_MIRROR[m];
              var sourceRows = getTypedRows(src, def.source_table);
              if (!sourceRows.length) {
                continue;
              }
              var insertSql = buildTypedInsertSql(def, buildWasmPlaceholders(def.columns.length));
              for (var r = 0; r < sourceRows.length; r += 1) {
                execBind(insertSql, typedBindRow(def, sourceRows[r]));
              }
            }
            if (opts && opts.importId) {
              execBind(
                "INSERT OR REPLACE INTO GN370_IMPORT_AUDIT(import_id,source_label,imported_at,records_total) VALUES(?,?,?,?)",
                [String(opts.importId), String(opts.source || "GN370"), now, importedRows]
              );
            }
            db.exec("COMMIT");
            typedMeta = typedMirrorMeta(src, now);
          } catch (e) {
            db.exec("ROLLBACK");
            throw e;
          }
        },
        dump: function () {
          var rows = [];
          var audits = [];
          db.exec({
            sql: "SELECT table_name, row_count, updated_at FROM GN370_TABLE_META ORDER BY table_name",
            rowMode: "object",
            resultRows: rows
          });
          db.exec({
            sql: "SELECT import_id, source_label, imported_at, records_total FROM GN370_IMPORT_AUDIT ORDER BY imported_at DESC LIMIT 25",
            rowMode: "object",
            resultRows: audits
          });
          return {
            mode: opfsEnabled ? "SQLITE_WASM_OPFS" : "SQLITE_WASM",
            sqlite_version: state.sqliteVersion,
            opfs_used: opfsEnabled,
            opfs_error: opfsInitError,
            table_meta: rows,
            import_audit: audits,
            typed_meta: clone(typedMeta)
          };
        }
      };
    } catch (e) {
      rememberError(e);
      return null;
    }
  }

  async function init(options) {
    var opts = options || {};
    state.schemaPath = opts.schemaPath || DEFAULT_SCHEMA_PATH;
    state.schemaText = await readSchema(state.schemaPath);

    var adapter = await createWorkerOpfsAdapter(state.schemaText);
    if (!adapter) {
      adapter = await createWasmSqliteAdapter(state.schemaText);
    }
    if (!adapter) {
      adapter = createMemoryShimAdapter();
      state.opfsUsed = false;
    }

    state.adapter = adapter;
    state.mode = adapter.mode;
    state.initialized = true;
    if (adapter.mode !== "MEMORY_SHIM") {
      state.lastError = null;
    }

    try {
      await Promise.resolve(adapter.recreate(state.schemaText));
    } catch (e) {
      rememberError(e);
    }

    return state.mode;
  }

  async function ensureInitialized() {
    if (!state.initialized) {
      await init({});
    }
  }

  async function recreate() {
    await ensureInitialized();
    try {
      await Promise.resolve(state.adapter.recreate(state.schemaText));
    } catch (e) {
      rememberError(e);
      throw e;
    }
  }

  async function syncTables(tables, opts) {
    await ensureInitialized();
    try {
      await Promise.resolve(state.adapter.syncTables(tables || {}, opts || {}));
      state.syncCount += 1;
      state.lastSyncAt = nowIso();
      state.lastError = null;
    } catch (e) {
      rememberError(e);
      throw e;
    }
  }

  function status() {
    return {
      initialized: state.initialized,
      mode: state.mode,
      schema_path: state.schemaPath,
      sync_count: state.syncCount,
      last_sync_at: state.lastSyncAt,
      sqlite_version: state.sqliteVersion,
      opfs_used: state.opfsUsed,
      opfs_error: state.opfsError,
      last_error: state.lastError
    };
  }

  function dump() {
    if (!state.adapter) {
      return {};
    }
    try {
      return state.adapter.dump();
    } catch (_) {
      return {};
    }
  }

  GN370.SQL_RUNTIME = {
    init: init,
    recreate: recreate,
    syncTables: syncTables,
    status: status,
    dump: dump
  };
}(window));
