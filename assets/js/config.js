(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};

  var defaults = {
    "terminal.width": 80,
    "terminal.height": 24,
    "gn370.theme.default": "terminal",
    "gn370.max.depth": 6,
    "gn370.strict.validation": true,
    "gn370.herald.enabled": true,
    "gn370.env": (global.__GN370_ENV || "dev")
  };

  var runtime = {};

  function normalizeKey(k) {
    return String(k || "").trim();
  }

  function get(key) {
    key = normalizeKey(key);
    return Object.prototype.hasOwnProperty.call(runtime, key) ? runtime[key] : defaults[key];
  }

  function set(key, value) {
    key = normalizeKey(key);
    runtime[key] = value;
    return value;
  }

  function show() {
    var merged = {};
    Object.keys(defaults).forEach(function (k) { merged[k] = defaults[k]; });
    Object.keys(runtime).forEach(function (k) { merged[k] = runtime[k]; });
    return merged;
  }

  function applyTheme(name) {
    var theme = name || get("gn370.theme.default") || "terminal";
    var link = document.getElementById("gn370-theme-style");
    if (link) {
      link.href = "assets/css/themes/" + theme + ".css";
    }
    set("gn370.theme.current", theme);
    if (global.__GN370_CTX) {
      global.__GN370_CTX.activeTheme = theme;
    }
    return theme;
  }

  GN370.CONFIG = {
    defaults: defaults,
    get: get,
    set: set,
    show: show,
    applyTheme: applyTheme
  };
}(window));
