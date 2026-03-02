(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};

  function parseJson(text) {
    var data = JSON.parse(String(text || "{}"));
    var houses = Array.isArray(data.houses) ? data.houses : [];
    var titles = Array.isArray(data.titles) ? data.titles : [];
    return {
      HOUSE: houses.map(function (h, i) {
        return {
          house_id: h.house_id || ("GNHOUSE" + String(i + 1).padStart(5, "0")),
          house_name: h.house_name || h.name || "",
          noble_rank: h.noble_rank || "",
          notes: h.notes || ""
        };
      }),
      TITLE: titles.map(function (t, i) {
        return {
          title_id: t.title_id || ("GNT" + String(i + 1).padStart(9, "0")),
          title_name: t.title_name || t.name || "",
          category: t.category || "",
          realm: t.realm || ""
        };
      })
    };
  }

  async function importFile(file) {
    if (GN370.STATE.getStatus() !== "READY") {
      var e = new Error("DB_NOT_READY");
      e.exitCode = 2;
      throw e;
    }
    var text = await file.text();
    var tables = parseJson(text);
    GN370.DB_ENGINE.merge(tables);
    GN370.JOURNAL.entry("IMPORT_NOBILITY", "DB", "-", "JSON loaded: " + file.name);
    return tables;
  }

  GN370.IMPORT = GN370.IMPORT || {};
  GN370.IMPORT.nobility = { parse: parseJson, importFile: importFile };
}(window));
