(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};

  function build(opts) {
    var root = opts.root || "UNKNOWN";
    var depth = opts.depth || 3;
    var nodes = [];
    for (var i = 0; i < depth; i += 1) {
      nodes.push('<text x="20" y="' + (30 + i * 24) + '">' + root + ' lvl ' + (i + 1) + '</text>');
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="320">' + nodes.join("") + '</svg>';
  }

  GN370.SVG = GN370.SVG || {};
  GN370.SVG.tree = { build: build };
}(window));
