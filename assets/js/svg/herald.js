(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};
  GN370.SVG = GN370.SVG || {};
  GN370.SVG.herald = {
    render: function (opts) {
      var title = (opts && opts.title) || "Stemma";
      return '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="240"><rect width="220" height="240" fill="#f5e6a7" stroke="#000"/><text x="20" y="30">' + title + '</text></svg>';
    }
  };
}(window));
