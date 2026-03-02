(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};

  GN370.HERALD = {
    show: function (id) {
      GN370.DB_ENGINE.gate();
      var rec = GN370.DB_ENGINE.query("HERALD", { herald_id: id })[0];
      return rec || null;
    }
  };
}(window));
