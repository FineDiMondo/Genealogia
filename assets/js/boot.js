(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  var bootStart = Date.now();
  var didBoot = false;
  var sqlModeReported = false;

  function bindInput() {
    var input = document.getElementById("gn370-input");
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        var cmd = input.value;
        input.value = "";
        GN370.RENDER.line("GN370$ " + cmd);
        Promise.resolve(GN370.ROUTER.dispatch(cmd)).catch(function (e) {
          GN370.RENDER.line("ERR: " + e.message, "line-error");
        });
      }
    });
  }

  function hardRefreshMemory(reason) {
    GN370.DB_ENGINE.reset();
    GN370.RENDER.setStatus("DB: EMPTY");
    if (GN370.RENDER && typeof GN370.RENDER.showHomeGateway === "function") {
      GN370.RENDER.showHomeGateway();
    } else {
      GN370.RENDER.showHomeImport();
    }
    GN370.RENDER.line("MEM: CLEAN", "line-ok");
    GN370.RENDER.line("DB: EMPTY", "line-ok");
    if (reason) {
      GN370.RENDER.line("MEM REFRESH: " + reason, "line-ok");
    }
  }

  function initSqlRuntime() {
    if (!GN370.SQL_RUNTIME || typeof GN370.SQL_RUNTIME.init !== "function") {
      global.__GN370_SQL_MODE = "DISABLED";
      return Promise.resolve();
    }
    return Promise.resolve(GN370.SQL_RUNTIME.init({
      schemaPath: "db/schema.sql"
    })).then(function (mode) {
      global.__GN370_SQL_MODE = mode || "UNKNOWN";
    }).catch(function (e) {
      global.__GN370_SQL_MODE = "ERROR";
      global.__GN370_SQL_ERROR = e && e.message ? e.message : String(e);
    });
  }

  function reportSqlMode() {
    if (!didBoot || sqlModeReported || !global.__GN370_SQL_MODE) {
      return;
    }
    GN370.RENDER.line("SQL MODE: " + global.__GN370_SQL_MODE, global.__GN370_SQL_MODE === "ERROR" ? "line-warn" : "line-ok");
    if (global.__GN370_SQL_ERROR) {
      GN370.RENDER.line("SQL ERR: " + global.__GN370_SQL_ERROR, "line-warn");
    }
    sqlModeReported = true;
  }

  function boot() {
    if (!didBoot) {
      GN370.RENDER.init();
      didBoot = true;
    }
    GN370.CONFIG.applyTheme(GN370.CONFIG.get("gn370.theme.default") || "risorgimentale");
    GN370.RENDER.line("GN370 BOOT", "line-ok");
    hardRefreshMemory("BOOT");
    GN370.RENDER.focusInput();

    GN370.JOURNAL.entry("SESSION_START", "SYSTEM", "-", "Boot completed");

    global.__GN370_BOOT_MS = Date.now() - bootStart;
    global.__GN370_BOOT_DONE = true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindInput();
    boot();
    Promise.resolve(initSqlRuntime()).finally(reportSqlMode);
  });

  global.addEventListener("pageshow", function (ev) {
    if (ev && ev.persisted && didBoot) {
      hardRefreshMemory("PAGESHOW");
    }
  });
}(window));
