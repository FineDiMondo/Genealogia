(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  var refs = {};

  function init() {
    refs.output = document.getElementById("gn370-output");
    refs.input = document.getElementById("gn370-input");
    refs.status = document.getElementById("gn370-status");
    refs.terminal = document.getElementById("gn370-terminal");
    refs.panel = document.createElement("div");
    refs.panel.id = "gn370-panel";
    refs.panel.style.marginBottom = "8px";
    refs.terminal.prepend(refs.panel);
  }

  function line(text, cls) {
    if (!refs.output) { return; }
    var safe = String(text == null ? "" : text);
    if (cls) {
      refs.output.innerHTML += "<span class=\"" + cls + "\">" + safe.replace(/</g, "&lt;") + "</span>\n";
    } else {
      refs.output.textContent += safe + "\n";
    }
    refs.output.scrollTop = refs.output.scrollHeight;
  }

  function clear() {
    if (refs.output) { refs.output.textContent = ""; }
    if (refs.panel) { refs.panel.innerHTML = ""; }
  }

  function setStatus(text) {
    if (refs.status) {
      refs.status.textContent = text;
    }
  }

  function focusInput() {
    if (refs.input) { refs.input.focus(); }
  }

  function writeHomeJournal(opType, entityId, description) {
    if (!GN370.JOURNAL || typeof GN370.JOURNAL.entry !== "function") {
      return;
    }
    GN370.JOURNAL.entry(opType, "HOME_GATEWAY", entityId || "-", description || "");
  }

  function homeState() {
    var theme = GN370.CONFIG && typeof GN370.CONFIG.get === "function"
      ? GN370.CONFIG.get("gn370.theme.current") || GN370.CONFIG.get("gn370.theme.default")
      : "n/a";
    var env = GN370.CONFIG && typeof GN370.CONFIG.get === "function"
      ? GN370.CONFIG.get("gn370.env")
      : "dev";
    var logs = GN370.JOURNAL && typeof GN370.JOURNAL.tail === "function"
      ? GN370.JOURNAL.tail(5)
      : [];
    return {
      dbStatus: global.__GN370_DB_STATUS || "EMPTY",
      memStatus: global.__GN370_MEM_STATUS || "CLEAN",
      env: env,
      theme: theme,
      sqlMode: global.__GN370_SQL_MODE || "UNKNOWN",
      opLogRows: logs
    };
  }

  function runGatewayCommand(cmd) {
    if (!cmd) {
      return;
    }
    line("GN370$ " + cmd);
    if (!GN370.ROUTER || typeof GN370.ROUTER.dispatch !== "function") {
      return;
    }
    Promise.resolve(GN370.ROUTER.dispatch(cmd)).catch(function (e) {
      line("ERR: " + (e && e.message ? e.message : String(e)), "line-error");
    });
  }

  function openZipImportPicker() {
    openFilePicker(".zip", false, async function (file) {
      var entries = await GN370.DB_ENGINE.listZipEntries(file);
      showZipEntries(file, entries);
    });
  }

  function showHomeGateway(opts) {
    if (!refs.panel) {
      return;
    }

    var options = opts || {};
    if (GN370.HOME_GATEWAY && typeof GN370.HOME_GATEWAY.buildHtml === "function") {
      refs.panel.innerHTML = GN370.HOME_GATEWAY.buildHtml(homeState());
      GN370.HOME_GATEWAY.bind(refs.panel, {
        onAction: function (action) {
          if (action === "start-guided") {
            writeHomeJournal("HOME_GATEWAY_PF", "PF1", "Avvio guidato 9 mondi");
            runGatewayCommand("proto home 80");
            return;
          }

          if (action === "import-gedcom") {
            writeHomeJournal("HOME_GATEWAY_PF", "PF2", "Import GEDCOM");
            runGatewayCommand("import gedcom");
            return;
          }

          if (action === "import-zip") {
            writeHomeJournal("HOME_GATEWAY_PF", "PF3", "Ripristino ZIP");
            openZipImportPicker();
            return;
          }

          if (action === "expert-console") {
            writeHomeJournal("HOME_GATEWAY_PF", "PF4", "Passaggio console esperta");
            focusInput();
            line("Console esperto attiva. Digita `help` per i comandi.", "line-ok");
            return;
          }

          if (action === "theme-risorgimentale") {
            var applied = GN370.CONFIG.applyTheme("risorgimentale");
            writeHomeJournal("HOME_GATEWAY_PF", "PF9", "Tema " + applied);
            line("Tema attivo: " + applied, "line-ok");
            showHomeGateway(options);
            return;
          }

          if (action === "open-player") {
            writeHomeJournal("HOME_GATEWAY_ACTION", "PLAYER", "Apertura modulo player");
            global.location.href = "player/";
            return;
          }

          if (action === "open-prototipo") {
            writeHomeJournal("HOME_GATEWAY_ACTION", "PROTOTIPO", "Apertura pagina prototipo web");
            global.location.href = "prototipo/";
            return;
          }

          if (action === "proto-nav") {
            writeHomeJournal("HOME_GATEWAY_ACTION", "PROTO_NAV", "Schema inter-mondi");
            runGatewayCommand("proto nav");
            return;
          }

          if (action === "proto-css") {
            writeHomeJournal("HOME_GATEWAY_ACTION", "PROTO_CSS", "Token CSS e simboli");
            runGatewayCommand("proto css");
            return;
          }

          line("Azione gateway non supportata: " + action, "line-warn");
        },
        onWorld: function (worldId) {
          var id = String(worldId || "").trim();
          if (!/^[1-9]$/.test(id)) {
            line("Mondo non valido: " + id, "line-warn");
            return;
          }
          writeHomeJournal("HOME_GATEWAY_WORLD_SELECT", "WORLD:" + id, "Apertura mondo " + id);
          runGatewayCommand("proto world " + id + " 80");
        }
      });
      writeHomeJournal("HOME_GATEWAY_OPEN", "GNHM0001", "Frontespizio operativo renderizzato");
      if (options.focusAction) {
        var focusEl = refs.panel.querySelector('[data-gnhm-action="' + options.focusAction + '"]');
        if (focusEl && typeof focusEl.focus === "function") {
          focusEl.focus();
        }
      }
      return;
    }

    refs.panel.innerHTML = "<div><strong>HOME GATEWAY non disponibile.</strong> Usa `db import` o `proto home 80`.</div>";
  }

  function showHomeImport() {
    showHomeGateway({ focusAction: "import-zip" });
  }

  function openFilePicker(accept, multiple, onPick) {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = accept || "*/*";
    input.multiple = !!multiple;
    input.style.display = "none";
    input.addEventListener("change", function () {
      if (!input.files || !input.files.length) { return; }
      onPick(input.files[0]);
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  }

  function showZipEntries(file, entries) {
    var stage = document.getElementById("gn370-zip-stage");
    if (!stage) { return; }
    var listHtml = entries.map(function (e) {
      return "<label><input type=\"checkbox\" class=\"gn370-entry\" value=\"" + e.replace(/"/g, "&quot;") + "\"> " + e + "</label><br>";
    }).join("");

    stage.innerHTML = ""
      + "<div>Archivio: <strong>" + file.name + "</strong></div>"
      + "<input id=\"gn370-filter\" placeholder=\"filtro nome file\">"
      + "<button id=\"gn370-select-all\">Seleziona tutto</button>"
      + "<div id=\"gn370-entry-list\" style=\"max-height:180px;overflow:auto;border:1px solid #2b2b2b;padding:6px\">" + listHtml + "</div>"
      + "<button id=\"gn370-import-btn\" disabled>IMPORTA</button>";

    var filter = document.getElementById("gn370-filter");
    var importBtn = document.getElementById("gn370-import-btn");
    var selectAll = document.getElementById("gn370-select-all");

    function selected() {
      return Array.from(document.querySelectorAll(".gn370-entry:checked")).map(function (c) { return c.value; });
    }

    function applyFilter() {
      var q = filter.value.toLowerCase();
      Array.from(document.querySelectorAll(".gn370-entry")).forEach(function (cb) {
        var line = cb.parentElement;
        line.style.display = cb.value.toLowerCase().indexOf(q) >= 0 ? "block" : "none";
      });
    }

    filter.addEventListener("input", applyFilter);
    selectAll.addEventListener("click", function () {
      Array.from(document.querySelectorAll(".gn370-entry")).forEach(function (cb) { cb.checked = true; });
      importBtn.disabled = false;
    });

    stage.addEventListener("change", function () {
      importBtn.disabled = selected().length === 0;
    });

    importBtn.addEventListener("click", async function () {
      var chosen = selected();
      if (!chosen.length) { return; }
      await GN370.DB_ENGINE.importZip(file, chosen);
      line("IMPORT OK: " + chosen.length + " file", "line-ok");
      setStatus("DB: READY");
    });
  }

  function printTable(rows) {
    rows.forEach(function (r) {
      line(JSON.stringify(r));
    });
  }

  GN370.RENDER = {
    init: init,
    line: line,
    clear: clear,
    setStatus: setStatus,
    focusInput: focusInput,
    showHomeGateway: showHomeGateway,
    showHomeImport: showHomeImport,
    openFilePicker: openFilePicker,
    showZipEntries: showZipEntries,
    printTable: printTable,
    refs: refs
  };
}(window));
