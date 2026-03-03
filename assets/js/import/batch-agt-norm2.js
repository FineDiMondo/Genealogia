(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};
  GN370.IMPORT = GN370.IMPORT || {};

  function run(tables, logs) {
    var findings = [];
    var person = tables.PERSON || [];
    var place = tables.PLACE || [];

    var surnameMap = {};
    person.forEach(function (p) {
      var s = String(p.surname || "").toUpperCase();
      if (!s) { return; }
      surnameMap[s] = (surnameMap[s] || 0) + 1;
    });
    Object.keys(surnameMap).forEach(function (s) {
      if (surnameMap[s] > 1) {
        findings.push({ code: "BAT-NORM2-001", msg: "duplicate surname canonical " + s, count: surnameMap[s] });
      }
    });

    var placeNormMap = {};
    place.forEach(function (p) {
      var key = String(p.place_name || "").trim().toUpperCase();
      if (!key) { return; }
      placeNormMap[key] = (placeNormMap[key] || 0) + 1;
    });
    Object.keys(placeNormMap).forEach(function (k) {
      if (placeNormMap[k] > 1) {
        findings.push({ code: "BAT-NORM2-002", msg: "place merge proposal " + k, count: placeNormMap[k] });
      }
    });

    (logs || []).forEach(function (l) {
      l.batch_results = l.batch_results || [];
      l.batch_results.push({
        batch_agent: "AGT_NORM2",
        batch_status: "K",
        batch_findings: findings.length,
        batch_msg: "Cross-record normalization done"
      });
    });

    return { agent: "AGT_NORM2", findings: findings };
  }

  GN370.IMPORT.batchAgtNorm2 = { run: run };
}(window));
