(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};
  GN370.IMPORT = GN370.IMPORT || {};

  function run(tables, logs) {
    var findings = [];
    var pending = tables.CORRELATION_PENDING || [];
    var person = tables.PERSON || [];

    for (var i = 0; i < person.length; i += 1) {
      for (var j = i + 1; j < person.length; j += 1) {
        var a = person[i];
        var b = person[j];
        if (!a.surname || !b.surname) { continue; }
        if (String(a.surname).toUpperCase() !== String(b.surname).toUpperCase()) { continue; }
        if (a.person_id === b.person_id) { continue; }
        var corr = {
          corr_id: "CORR" + String(pending.length + 1).padStart(6, "0"),
          corr_type: "FAMILY_IMPLICIT",
          source_id: a.person_id,
          target_id: b.person_id,
          confidence: 78,
          status: "PENDING_REVIEW",
          msg: "Same surname lineage candidate"
        };
        pending.push(corr);
        findings.push({ code: "BAT-CORR-001", msg: corr.msg, corr_id: corr.corr_id });
      }
    }

    tables.CORRELATION_PENDING = pending;
    (logs || []).forEach(function (l) {
      l.batch_results = l.batch_results || [];
      l.batch_results.push({
        batch_agent: "AGT_CORRELATE",
        batch_status: "K",
        batch_findings: findings.length,
        batch_msg: "Correlation scan done"
      });
      l.log_closed = true;
    });
    return { agent: "AGT_CORRELATE", findings: findings, pending: pending };
  }

  GN370.IMPORT.batchAgtCorr = { run: run };
}(window));
