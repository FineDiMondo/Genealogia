(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};
  GN370.SVG = GN370.SVG || {};
  GN370.SVG.timeline = {
    render: function (opts) {
      var id = (opts && opts.person) || "-";
      return '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="180"><line x1="20" y1="90" x2="700" y2="90" stroke="#ddd"/><text x="20" y="40">TIMELINE ' + id + '</text></svg>';
    }
  };
}(window));
