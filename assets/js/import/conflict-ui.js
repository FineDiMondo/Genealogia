(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  GN370.IMPORT = GN370.IMPORT || {};

  function renderAscii(conflicts) {
    var rows = [];
    rows.push("GN370 CONFLICT PANEL");
    rows.push("A=ACCEPT_NEW K=KEEP_EXIST M=MERGE S=SKIP");
    rows.push("------------------------------------------------------------");
    (conflicts || []).forEach(function (c, idx) {
      rows.push(
        String(idx + 1).padStart(3, "0") + " " +
        (c.pipeline_id || "") + " " +
        "sev=" + c.severity + " score=" + c.similarity_score + " existing=" + (c.existing_id || "-")
      );
    });
    return rows.join("\n");
  }

  function defaultDecision(conflict, options) {
    var opts = options || {};
    if (opts.autoSkipLow && conflict.severity === "LOW") {
      return "SKIP";
    }
    if (conflict.severity === "NONE") {
      return "ACCEPT_NEW";
    }
    if (opts.forceAccept) {
      return "ACCEPT_NEW";
    }
    return "PENDING";
  }

  function resolve(conflicts, options) {
    var decisions = {};
    var pending = [];
    (conflicts || []).forEach(function (c) {
      var d = defaultDecision(c, options);
      decisions[c.pipeline_id] = d;
      if (d === "PENDING") {
        pending.push(c);
      }
    });
    return {
      decisions: decisions,
      pending: pending,
      panel: renderAscii(conflicts)
    };
  }

  function applyDecision(decisions, pipelineId, decision) {
    decisions[pipelineId] = decision;
    return decisions;
  }

  GN370.IMPORT.conflictUI = {
    renderAscii: renderAscii,
    resolve: resolve,
    applyDecision: applyDecision
  };
}(window));
