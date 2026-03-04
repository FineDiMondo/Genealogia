(function (global) {
  "use strict";

  var GN370 = (global.GN370 = global.GN370 || {});

  var WORLDS = [
    { id: "1", pf: "PF1", label: "ORIGINI", summary: "Linea regia e titoli" },
    { id: "2", pf: "PF2", label: "CICLI", summary: "Nascite, morti, matrimoni" },
    { id: "3", pf: "PF3", label: "DONI", summary: "Mestieri e talenti ereditati" },
    { id: "4", pf: "PF4", label: "OMBRE", summary: "Traumi e nodi storici" },
    { id: "5", pf: "PF5", label: "CONTESTO", summary: "Eventi storici e geografia" },
    { id: "6", pf: "PF6", label: "STRUTTURA", summary: "DNA e tracce biologiche" },
    { id: "7", pf: "PF7", label: "EREDITA", summary: "Patrimonio materiale" },
    { id: "8", pf: "PF8", label: "NEBBIA", summary: "Lacune e ricerca guidata" },
    { id: "9", pf: "PF9", label: "RADICI", summary: "Origine documentale e profonda" },
  ];

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function worldCards() {
    return WORLDS.map(function (w) {
      return (
        '<button class="gnhm-world-card" type="button" data-gnhm-world="' +
        esc(w.id) +
        '" aria-label="Apri mondo ' +
        esc(w.id + " " + w.label) +
        '">' +
        '<span class="gnhm-world-head">' +
        '<span class="gnhm-world-pf">' +
        esc(w.pf) +
        "</span>" +
        '<span class="gnhm-world-label">[WORLD:' +
        esc(w.id) +
        "] " +
        esc(w.label) +
        "</span>" +
        "</span>" +
        '<span class="gnhm-world-summary">' +
        esc(w.summary) +
        "</span>" +
        "</button>"
      );
    }).join("");
  }

  function opLogRows(rows) {
    if (!rows || !rows.length) {
      return '<li class="gnhm-log-empty">Nessun evento utente registrato in questa sessione.</li>';
    }
    return rows
      .map(function (row) {
        return (
          "<li>" +
          '<span class="gnhm-log-ts">' +
          esc(row.entry_ts || "") +
          "</span>" +
          '<span class="gnhm-log-op">' +
          esc(row.op_type || "") +
          "</span>" +
          '<span class="gnhm-log-desc">' +
          esc(row.description || "") +
          "</span>" +
          "</li>"
        );
      })
      .join("");
  }

  function buildHtml(state) {
    var st = state || {};
    var logRows = st.opLogRows || [];
    return (
      '<section class="gnhm-shell" aria-label="GNHM0001 Home Gateway">' +
      '<header class="gnhm-head">' +
      '<div class="gnhm-program">PROGRAMMA: GNHM0001 | FRONTESPIZIO OPERATIVO</div>' +
      '<div class="gnhm-state">' +
      "<span>DB: " +
      esc(st.dbStatus || "EMPTY") +
      "</span>" +
      "<span>MEM: " +
      esc(st.memStatus || "CLEAN") +
      "</span>" +
      "<span>ENV: " +
      esc(st.env || "dev") +
      "</span>" +
      "<span>TEMA: " +
      esc(st.theme || "risorgimentale") +
      "</span>" +
      "<span>SQL: " +
      esc(st.sqlMode || "N/A") +
      "</span>" +
      "</div>" +
      "</header>" +
      '<div class="gnhm-grid">' +
      '<section class="gnhm-pane gnhm-pane-left">' +
      "<h3>Transazioni Rapide</h3>" +
      '<button type="button" class="gnhm-btn gnhm-btn-primary" data-gnhm-action="start-guided">PF1 Avvio Guidato 9 Mondi</button>' +
      '<button type="button" class="gnhm-btn" data-gnhm-action="import-gedcom">PF2 Import GEDCOM</button>' +
      '<button type="button" class="gnhm-btn" id="gn370-btn-pick-zip" data-gnhm-action="import-zip">PF3 Ripristino ZIP</button>' +
      '<button type="button" class="gnhm-btn" data-gnhm-action="expert-console">PF4 Console Esperto</button>' +
      '<button type="button" class="gnhm-btn" data-gnhm-action="theme-risorgimentale">PF9 Tema Risorgimentale</button>' +
      '<button type="button" class="gnhm-btn" data-gnhm-action="open-prototipo">PROTOTIPO WEB</button>' +
      '<button type="button" class="gnhm-btn" data-gnhm-action="open-player">PLAYER FLAC</button>' +
      '<div class="gnhm-zip-stage" id="gn370-zip-stage"></div>' +
      "</section>" +
      '<section class="gnhm-pane gnhm-pane-center">' +
      "<h3>9 Mondi - Navigazione Diretta</h3>" +
      '<div class="gnhm-world-grid">' +
      worldCards() +
      "</div>" +
      '<div class="gnhm-hints">' +
      "<strong>Hint:</strong> seleziona un mondo per aprire direttamente la sequenza (SEQ:1..9)." +
      "</div>" +
      "</section>" +
      '<section class="gnhm-pane gnhm-pane-right">' +
      "<h3>Registro Operativo</h3>" +
      '<ul class="gnhm-oplog">' +
      opLogRows(logRows) +
      "</ul>" +
      '<div class="gnhm-links">' +
      '<button type="button" class="gnhm-link-btn" data-gnhm-action="proto-nav">Schema Inter-Mondi</button>' +
      '<button type="button" class="gnhm-link-btn" data-gnhm-action="proto-css">Token CSS e Simboli</button>' +
      '<a class="gnhm-link-btn" href="control/">Control Center</a>' +
      "</div>" +
      "</section>" +
      "</div>" +
      '<footer class="gnhm-foot">CMD: GN370$ | @SELF@ | #ROOT# | ~GAP~ | PF1..PF9</footer>' +
      "</section>"
    );
  }

  function bind(root, handlers) {
    var h = handlers || {};
    if (!root) {
      return;
    }
    root.querySelectorAll("[data-gnhm-action]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (typeof h.onAction === "function") {
          h.onAction(String(el.getAttribute("data-gnhm-action") || ""));
        }
      });
    });
    root.querySelectorAll("[data-gnhm-world]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (typeof h.onWorld === "function") {
          h.onWorld(String(el.getAttribute("data-gnhm-world") || ""));
        }
      });
    });
  }

  GN370.HOME_GATEWAY = {
    worlds: WORLDS.slice(),
    buildHtml: buildHtml,
    bind: bind,
  };
})(window);
