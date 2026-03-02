(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};

  function parseXml(text) {
    var source = [];
    var citation = [];
    var docs = String(text || "").match(/<document[\s\S]*?<\/document>/g) || [];
    docs.forEach(function (doc, idx) {
      var id = "GNS" + String(idx + 1).padStart(9, "0");
      var title = (doc.match(/<title>([\s\S]*?)<\/title>/i) || ["", ""])[1].trim();
      source.push({ source_id: id, title: title, source_type: "NOTARIAL" });
      citation.push({ citation_id: "GNC" + String(idx + 1).padStart(9, "0"), source_id: id, note: "XML import" });
    });
    return { SOURCE: source, CITATION: citation };
  }

  async function importFile(file) {
    if (GN370.STATE.getStatus() !== "READY") {
      var e = new Error("DB_NOT_READY");
      e.exitCode = 2;
      throw e;
    }
    var text = await file.text();
    var tables = parseXml(text);
    GN370.DB_ENGINE.merge(tables);
    GN370.JOURNAL.entry("IMPORT_NOTARIAL", "DB", "-", "XML loaded: " + file.name);
    return tables;
  }

  GN370.IMPORT = GN370.IMPORT || {};
  GN370.IMPORT.notarial = { parse: parseXml, importFile: importFile };
}(window));
