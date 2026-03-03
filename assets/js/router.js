(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  var history = [];

  function tokenize(raw) {
    return String(raw || "").trim().split(/\s+/).filter(Boolean);
  }

  function ensureReady() {
    GN370.DB_ENGINE.gate();
  }

  function parseOption(tokens, key, fallback) {
    var idx = tokens.indexOf(key);
    if (idx >= 0 && tokens[idx + 1]) {
      return tokens[idx + 1];
    }
    return fallback;
  }

  function printError(err) {
    var msg = err && err.message ? err.message : String(err);
    GN370.RENDER.line("ERR: " + msg, "line-error");
  }

  async function dispatch(raw) {
    var tokens = tokenize(raw);
    if (!tokens.length) {
      return;
    }
    history.push(raw);

    var cmd = tokens[0].toLowerCase();
    var cmd2 = tokens.slice(0, 2).join(" ").toLowerCase();
    var cmd3 = tokens.slice(0, 3).join(" ").toLowerCase();

    try {
      if (cmd === "help") {
        GN370.RENDER.line("Comandi: help man status clear mem refresh db import db list db show db reset db export import gedcom [--dry-run --auto-skip-low --strict] import status import log import conflicts import review <corr_id> import accept <corr_id> import batch rerun import herald import notarial import nobility open find tree map timeline validate story journal monitor config theme quit");
        return;
      }

      if (cmd === "man") {
        GN370.RENDER.line(GN370.MAN.get(tokens.slice(1).join(" ")));
        return;
      }

      if (cmd === "clear") {
        GN370.RENDER.clear();
        return;
      }

      if (cmd === "status") {
        var dump = GN370.DB_ENGINE.dump();
        GN370.RENDER.line("DB.status=" + GN370.STATE.getStatus());
        GN370.RENDER.line("tables=" + Object.keys(dump.tables).length);
        GN370.RENDER.line("ctx.openedRecord=" + (GN370.STATE.getCtx().openedRecord || "null"));
        GN370.RENDER.line("env=" + GN370.CONFIG.get("gn370.env"));
        return;
      }

      if (cmd2 === "db import") {
        GN370.RENDER.showHomeImport();
        GN370.RENDER.line("HOME IMPORT attiva: seleziona ZIP e poi IMPORTA.");
        return;
      }

      if (cmd2 === "db list") {
        ensureReady();
        GN370.DB_ENGINE.listTables().forEach(function (r) {
          GN370.RENDER.line(r.table + "\t" + r.rows);
        });
        return;
      }

      if (cmd2 === "db show") {
        ensureReady();
        var tableName = (tokens[2] || "").toUpperCase();
        if (!tableName) {
          GN370.RENDER.line("Uso: db show <TABLENAME>", "line-warn");
          return;
        }
        var rows = GN370.DB_ENGINE.query(tableName);
        var limit = Number(parseOption(tokens, "--limit", "20"));
        GN370.RENDER.printTable(rows.slice(0, limit));
        return;
      }

      if (cmd2 === "db reset") {
        GN370.DB_ENGINE.reset();
        GN370.RENDER.setStatus("DB: EMPTY");
        GN370.RENDER.showHomeImport();
        GN370.RENDER.line("DB reset completato", "line-ok");
        return;
      }

      if (cmd2 === "mem refresh" || cmd2 === "memory reset") {
        GN370.DB_ENGINE.reset();
        GN370.RENDER.setStatus("DB: EMPTY");
        GN370.RENDER.showHomeImport();
        GN370.RENDER.line("MEM refresh completato", "line-ok");
        return;
      }

      if (cmd2 === "db export") {
        ensureReady();
        var fileName = await GN370.DB_ENGINE.commit();
        GN370.RENDER.line("EXPORT OK: " + fileName, "line-ok");
        return;
      }

      if (cmd2 === "import status") {
        var st = GN370.GEDCOM.status();
        if (!st) {
          GN370.RENDER.line("Nessuna sessione import GEDCOM.", "line-warn");
        } else {
          GN370.RENDER.line(JSON.stringify(st.stage_stats, null, 2));
        }
        return;
      }

      if (cmd2 === "import log") {
        var rid = parseOption(tokens, "--record", "");
        var nlogs = parseOption(tokens, "--n", "");
        var logs = GN370.GEDCOM.importLog({ recordId: rid || "", n: nlogs ? Number(nlogs) : null });
        if (!logs.length) {
          GN370.RENDER.line("IMPORT_LOG vuoto o DB non READY.", "line-warn");
          return;
        }
        GN370.RENDER.printTable(logs);
        return;
      }

      if (cmd2 === "import conflicts") {
        var pending = GN370.GEDCOM.conflicts();
        if (!pending.length) {
          GN370.RENDER.line("Nessun conflitto pendente.", "line-ok");
        } else {
          GN370.RENDER.line("CONFLICT PANEL:");
          GN370.RENDER.line(GN370.IMPORT.conflictUI.renderAscii(pending));
        }
        return;
      }

      if (cmd2 === "import review") {
        var corrId = tokens[2] || "";
        var corr = GN370.GEDCOM.reviewCorrelation(corrId);
        GN370.RENDER.line(corr ? JSON.stringify(corr, null, 2) : "Correlation non trovata", corr ? "line-ok" : "line-warn");
        return;
      }

      if (cmd2 === "import accept") {
        var corrId2 = tokens[2] || "";
        var accepted = GN370.GEDCOM.acceptCorrelation(corrId2);
        GN370.RENDER.line(accepted ? "Correlation accettata." : "Correlation non trovata.", accepted ? "line-ok" : "line-warn");
        return;
      }

      if (cmd3 === "import batch rerun") {
        var batch = GN370.GEDCOM.rerunBatch();
        GN370.RENDER.line("Batch rerun completato: " + JSON.stringify({
          ic: batch.ic.findings.length,
          norm2: batch.norm2.findings.length,
          corr: batch.corr.findings.length
        }), "line-ok");
        return;
      }

      if (cmd2 === "import gedcom") {
        var importOpts = {
          dryRun: tokens.indexOf("--dry-run") >= 0,
          autoSkipLow: tokens.indexOf("--auto-skip-low") >= 0,
          strict: tokens.indexOf("--strict") >= 0
        };
        GN370.RENDER.openFilePicker(".ged,.gedcom", false, async function (file) {
          var session = await GN370.GEDCOM.start(file, importOpts);
          GN370.RENDER.line("GEDCOM pipeline session: " + session.session_id, "line-ok");
          GN370.RENDER.line(JSON.stringify(session.stage_stats, null, 2));
          if (!importOpts.dryRun) {
            GN370.RENDER.setStatus("DB: READY");
          }
          if (session.stage_stats.s5_pending > 0) {
            GN370.RENDER.line("Conflitti pendenti: usa `import conflicts`.", "line-warn");
          }
        });
        return;
      }

      if (cmd2 === "import herald") {
        ensureReady();
        GN370.RENDER.openFilePicker(".csv", false, async function (file) {
          await GN370.IMPORT.herald.importFile(file);
          GN370.RENDER.line("HERALD import completato", "line-ok");
        });
        return;
      }

      if (cmd2 === "import notarial") {
        ensureReady();
        GN370.RENDER.openFilePicker(".xml", false, async function (file) {
          await GN370.IMPORT.notarial.importFile(file);
          GN370.RENDER.line("NOTARIAL import completato", "line-ok");
        });
        return;
      }

      if (cmd2 === "import nobility") {
        ensureReady();
        GN370.RENDER.openFilePicker(".json", false, async function (file) {
          await GN370.IMPORT.nobility.importFile(file);
          GN370.RENDER.line("NOBILITY import completato", "line-ok");
        });
        return;
      }

      if (cmd === "open") {
        ensureReady();
        var entity = (tokens[1] || "").toUpperCase();
        var id = tokens[2] || "";
        var tableMap = { PERSON: "PERSON", FAMILY: "FAMILY", HOUSE: "HOUSE", HERALD: "HERALD", SEAL: "SEAL" };
        var idFieldMap = { PERSON: "person_id", FAMILY: "family_id", HOUSE: "house_id", HERALD: "herald_id", SEAL: "seal_id" };
        var table = tableMap[entity];
        if (!table) {
          GN370.RENDER.line("Entity non supportata", "line-warn");
          return;
        }
        var where = {}; where[idFieldMap[entity]] = id;
        var rec = GN370.DB_ENGINE.query(table, where)[0];
        GN370.RENDER.line(rec ? JSON.stringify(rec, null, 2) : "Record non trovato", rec ? "line-ok" : "line-warn");
        GN370.STATE.getCtx().openedRecord = rec || null;
        return;
      }

      if (cmd === "find") {
        ensureReady();
        var target = (tokens[1] || "").toUpperCase();
        var tableTarget = target === "PERSON" ? "PERSON" : (target === "HOUSE" ? "HOUSE" : (target === "TITLE" ? "TITLE" : ""));
        if (!tableTarget) {
          GN370.RENDER.line("Uso: find person|house|title [--name testo]", "line-warn");
          return;
        }
        var key = parseOption(tokens, "--name", "").toLowerCase();
        var rowsTarget = GN370.DB_ENGINE.query(tableTarget).filter(function (r) {
          return !key || JSON.stringify(r).toLowerCase().indexOf(key) >= 0;
        });
        GN370.RENDER.line("Trovati " + rowsTarget.length + " record");
        GN370.RENDER.printTable(rowsTarget.slice(0, 20));
        return;
      }

      if (cmd === "tree") {
        ensureReady();
        var root = parseOption(tokens, "--root", "GNP000000001");
        var depth = Number(parseOption(tokens, "--depth", "3"));
        GN370.RENDER.line(GN370.SVG.tree.build({ root: root, depth: depth }));
        return;
      }

      if (cmd === "map") {
        ensureReady();
        var period = parseOption(tokens, "--period", "normanno");
        GN370.RENDER.line(GN370.SVG.map.render({ period: period }));
        return;
      }

      if (cmd === "timeline") {
        ensureReady();
        var person = parseOption(tokens, "--person", "GNP000000001");
        GN370.RENDER.line(GN370.SVG.timeline.render({ person: person }));
        return;
      }

      if (cmd === "validate") {
        ensureReady();
        var reportVal = GN370.VALIDATE.run(GN370.DB_ENGINE.dump().tables);
        GN370.RENDER.line("VALIDATE errors=" + reportVal.errors.length + " warnings=" + reportVal.warnings.length);
        reportVal.errors.forEach(function (e) { GN370.RENDER.line(e.code + " " + e.message, "line-error"); });
        reportVal.warnings.forEach(function (w) { GN370.RENDER.line(w.code + " " + w.message, "line-warn"); });
        return;
      }

      if (cmd2 === "story list") {
        ensureReady();
        GN370.RENDER.line("SAMPLE\nALTLINE\nTITLES01");
        return;
      }

      if (cmd2 === "story play") {
        ensureReady();
        var storyId = tokens[2] || "SAMPLE";
        GN370.STATE.getCtx().activeStory = storyId;
        GN370.RENDER.line("PLAY STORY " + storyId);
        return;
      }

      if (cmd2 === "journal tail") {
        var n = Number(parseOption(tokens, "--n", "10"));
        GN370.JOURNAL.tail(n).forEach(function (row) { GN370.RENDER.line(JSON.stringify(row)); });
        return;
      }

      if (cmd2 === "journal grep") {
        var pattern = tokens.slice(2).join(" ").replace(/^"|"$/g, "");
        GN370.JOURNAL.grep(pattern).forEach(function (row) { GN370.RENDER.line(JSON.stringify(row)); });
        return;
      }

      if (cmd === "monitor") {
        var what = (tokens[1] || "db").toLowerCase();
        if (!GN370.MONITOR[what]) {
          GN370.RENDER.line("monitor db|system|herald|env|perf", "line-warn");
          return;
        }
        GN370.RENDER.line(GN370.MONITOR[what]());
        return;
      }

      if (cmd2 === "config show") {
        GN370.RENDER.line(JSON.stringify(GN370.CONFIG.show(), null, 2));
        return;
      }

      if (cmd2 === "config set") {
        var key = tokens[2];
        var value = tokens.slice(3).join(" ");
        GN370.CONFIG.set(key, value);
        GN370.RENDER.line("CONFIG SET " + key + "=" + value);
        return;
      }

      if (cmd === "theme") {
        var theme = tokens[1] || "terminal";
        var applied = GN370.CONFIG.applyTheme(theme);
        GN370.RENDER.line("Tema attivo: " + applied, "line-ok");
        return;
      }

      if (cmd === "quit") {
        GN370.JOURNAL.entry("SESSION_END", "SYSTEM", "-", "quit");
        GN370.RENDER.line("Sessione terminata");
        return;
      }

      GN370.RENDER.line("Comando non riconosciuto: " + raw, "line-warn");
    } catch (err) {
      printError(err);
    }
  }

  GN370.ROUTER = {
    dispatch: dispatch,
    history: function () { return history.slice(); }
  };
}(window));
