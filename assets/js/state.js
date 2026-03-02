(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};

  var STATES = {
    EMPTY: "EMPTY",
    READY: "READY",
    ERROR: "ERROR"
  };

  var allowed = {
    EMPTY: { READY: true, ERROR: true, EMPTY: true },
    READY: { EMPTY: true, ERROR: true, READY: true },
    ERROR: { EMPTY: true, ERROR: true }
  };

  var state = {
    status: STATES.EMPTY,
    ctx: {
      openedRecord: null,
      openedFamily: null,
      activeStory: null,
      activeTheme: null
    },
    audit: []
  };

  function syncGlobals() {
    global.__GN370_DB_STATUS = state.status;
    global.__GN370_CTX = state.ctx;
  }

  function addAudit(action, info) {
    state.audit.push({
      ts: new Date().toISOString(),
      action: action,
      info: info || null
    });
  }

  function transition(next, reason) {
    var current = state.status;
    if (!allowed[current] || !allowed[current][next]) {
      var err = new Error("ILLEGAL_STATE_TRANSITION: " + current + " -> " + next);
      err.exitCode = 4;
      throw err;
    }
    state.status = next;
    syncGlobals();
    addAudit("STATE", { from: current, to: next, reason: reason || "" });
    return state.status;
  }

  function resetCtx() {
    state.ctx = {
      openedRecord: null,
      openedFamily: null,
      activeStory: null,
      activeTheme: null
    };
    syncGlobals();
  }

  function resetAll() {
    state.status = STATES.EMPTY;
    state.audit = [];
    resetCtx();
    addAudit("RESET", { hard: true });
  }

  syncGlobals();

  GN370.STATE = {
    STATES: STATES,
    getStatus: function () { return state.status; },
    getCtx: function () { return state.ctx; },
    getAudit: function () { return state.audit.slice(); },
    transition: transition,
    resetCtx: resetCtx,
    resetAll: resetAll,
    addAudit: addAudit
  };
}(window));
