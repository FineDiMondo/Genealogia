(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};

  function tableCounts() {
    try {
      return GN370.DB_ENGINE.listTables();
    } catch (_) {
      return [];
    }
  }

  function dbDashboard() {
    var rows = tableCounts();
    var text = ["MONITOR DB", "STATUS: " + GN370.STATE.getStatus()];
    rows.forEach(function (r) { text.push(r.table + " => " + r.rows); });
    return text.join("\n");
  }

  function systemDashboard() {
    return [
      "MONITOR SYSTEM",
      "ENV: " + GN370.CONFIG.get("gn370.env"),
      "THEME: " + (GN370.CONFIG.get("gn370.theme.current") || GN370.CONFIG.get("gn370.theme.default")),
      "AUDIT: " + GN370.STATE.getAudit().length
    ].join("\n");
  }

  function envDashboard() {
    return "MONITOR ENV\nactive=" + GN370.CONFIG.get("gn370.env") + " schema=" + GN370.CONFIG.get("gn370.schema", "2.0");
  }

  GN370.MONITOR = {
    db: dbDashboard,
    system: systemDashboard,
    herald: function () { return "MONITOR HERALD\nrecords=" + (GN370.DB_ENGINE.dump().tables.HERALD || []).length; },
    env: envDashboard,
    perf: function () { return "MONITOR PERF\nboot_fetch_count=" + (global.__GN370_BOOT_FETCH_COUNT || 0); }
  };
}(window));
