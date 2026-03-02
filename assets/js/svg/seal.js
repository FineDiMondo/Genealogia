(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};
  GN370.SVG = GN370.SVG || {};
  GN370.SVG.seal = {
    render: function (opts) {
      var id = (opts && opts.id) || "SIGILLO";
      return '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="100" cy="100" r="80" fill="#ddd" stroke="#222"/><text x="55" y="105">' + id + '</text></svg>';
    }
  };
}(window));
