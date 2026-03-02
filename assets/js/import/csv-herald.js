(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};

  function parseCsv(text) {
    var lines = String(text || "").split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (lines.length < 2) {
      return { HOUSE: [], HERALD: [], MEDIA: [] };
    }
    var headers = lines[0].split(",").map(function (h) { return h.trim(); });
    var rows = lines.slice(1).map(function (line) {
      var cols = line.split(",");
      var rec = {};
      headers.forEach(function (h, i) { rec[h] = (cols[i] || "").trim(); });
      return rec;
    });

    var house = [];
    var herald = [];
    var media = [];

    rows.forEach(function (r, idx) {
      var hid = r.house_id || ("GNHOUSE" + String(idx + 1).padStart(5, "0"));
      house.push({
        house_id: hid,
        house_name: r.house_name || "",
        origin_region: r.origin_region || "",
        noble_rank: r.noble_rank || "",
        notes: r.notes || ""
      });
      herald.push({
        herald_id: "GNH" + String(idx + 1).padStart(9, "0"),
        house_id: hid,
        blazon_ita: r.blazon_ita || "",
        blazon_lat: r.blazon_lat || "",
        svg_filename: r.svg_filename || ""
      });
      media.push({
        media_id: "GNM" + String(idx + 1).padStart(9, "0"),
        entity_type: "HOUSE",
        entity_id: hid,
        filename: r.svg_filename || "",
        is_vector: /\.svg$/i.test(r.svg_filename || "") ? "Y" : "N"
      });
    });

    return { HOUSE: house, HERALD: herald, MEDIA: media };
  }

  async function importFile(file) {
    if (GN370.STATE.getStatus() !== "READY") {
      var e = new Error("DB_NOT_READY");
      e.exitCode = 2;
      throw e;
    }
    var text = await file.text();
    var tables = parseCsv(text);
    GN370.DB_ENGINE.merge(tables);
    GN370.JOURNAL.entry("IMPORT_HERALD", "DB", "-", "Herald CSV loaded: " + file.name);
    return tables;
  }

  GN370.IMPORT = GN370.IMPORT || {};
  GN370.IMPORT.herald = {
    parse: parseCsv,
    importFile: importFile
  };
}(window));
