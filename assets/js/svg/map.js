(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};
  GN370.SVG = GN370.SVG || {};
  GN370.SVG.map = {
    render: function (opts) {
      var period = (opts && opts.period) || "normanno";
      return '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="280"><rect width="640" height="280" fill="#0f1a2d"/><text x="20" y="30" fill="#fff">MAPPA STORICA ' + period + '</text></svg>';
    }
  };
}(window));
