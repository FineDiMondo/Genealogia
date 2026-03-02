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

  function showHomeImport() {
    if (!refs.panel) { return; }
    var html = "";
    html += "<div><strong>HOME IMPORT</strong></div>";
    html += "<div>DB: EMPTY | MEM: CLEAN</div>";
    html += "<button id=\"gn370-btn-pick-zip\">Scegli archivio ZIP</button>";
    html += "<div id=\"gn370-zip-stage\"></div>";
    refs.panel.innerHTML = html;

    var btn = document.getElementById("gn370-btn-pick-zip");
    btn.addEventListener("click", function () {
      openFilePicker(".zip", false, async function (file) {
        var entries = await GN370.DB_ENGINE.listZipEntries(file);
        showZipEntries(file, entries);
      });
    });
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
    showHomeImport: showHomeImport,
    openFilePicker: openFilePicker,
    showZipEntries: showZipEntries,
    printTable: printTable,
    refs: refs
  };
}(window));
