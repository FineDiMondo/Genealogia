(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  var bootStart = Date.now();

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

  function boot() {
    GN370.RENDER.init();
    GN370.DB_ENGINE.reset();
    GN370.CONFIG.applyTheme(GN370.CONFIG.get("gn370.theme.default") || "terminal");

    GN370.RENDER.line("GN370 BOOT", "line-ok");
    GN370.RENDER.line("MEM: CLEAN", "line-ok");
    GN370.RENDER.line("DB: EMPTY", "line-ok");
    GN370.RENDER.showHomeImport();
    GN370.RENDER.setStatus("DB: EMPTY");
    GN370.RENDER.focusInput();

    GN370.JOURNAL.entry("SESSION_START", "SYSTEM", "-", "Boot completed");

    global.__GN370_BOOT_MS = Date.now() - bootStart;
    global.__GN370_BOOT_DONE = true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindInput();
    boot();
  });
}(window));
