(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};

  var pages = {
    help: "help: elenco comandi | man <cmd>: dettaglio comando",
    status: "status: mostra stato DB, ambiente e conteggi",
    "db import": "db import: apre file picker ZIP e importa tabelle selezionate",
    "db export": "db export: esporta DB in AAAAGGMMHHMM.zip",
    validate: "validate: esegue IC/W check read-only",
    theme: "theme <nome>: normanno/svevo/aragonese/castigliano/risorgimentale/terminal"
  };

  GN370.MAN = {
    list: function () { return Object.keys(pages).sort(); },
    get: function (cmd) { return pages[cmd] || "manpage non trovata"; }
  };
}(window));
