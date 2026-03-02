(function () {
  "use strict";

  var PREFIX = "tx2.";

  function resetTx2() {
    var keys = [];
    for (var i = 0; i < sessionStorage.length; i++) {
      var k = sessionStorage.key(i);
      if (k && k.indexOf(PREFIX) === 0) {
        keys.push(k);
      }
    }
    keys.forEach(function (k) { sessionStorage.removeItem(k); });
  }

  function runPf(pf) {
    if (pf === "PF3") { history.back(); return; }
    if (pf === "PF4") { resetTx2(); return; }
    if (pf === "PF5") {
      syncFields();
      if (window.TX2 && typeof window.TX2.next === "function") { window.TX2.next(); }
      return;
    }
    if (pf === "PF6") {
      syncFields();
      if (window.TX2 && typeof window.TX2.confirm === "function") { window.TX2.confirm(); }
      return;
    }
    if (pf === "PF12") {
      var b = document.querySelector("[data-pf='PF12']");
      var href = (b && b.getAttribute("data-href")) || "./console.html";
      window.location.href = href;
    }
  }

  function bindButtons() {
    var buttons = document.querySelectorAll(".pfbar [data-pf]");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.disabled) { return; }
        runPf(btn.getAttribute("data-pf"));
      });
    });
  }

  function bindKeyboard() {
    document.addEventListener("keydown", function (e) {
      var keyMap = { F3: "PF3", F4: "PF4", F5: "PF5", F6: "PF6", F12: "PF12" };
      if (keyMap[e.key]) {
        e.preventDefault();
        runPf(keyMap[e.key]);
      }
      if (e.altKey && e.key === "6") {
        e.preventDefault();
        runPf("PF6");
      }
    });
  }

  function syncFields() {
    var fields = document.querySelectorAll(".tx2-field[data-key]");
    fields.forEach(function (f) {
      var key = f.getAttribute("data-key");
      if (key) {
        sessionStorage.setItem("tx2." + key, f.value || "");
      }
    });
  }

  function restoreFields() {
    var fields = document.querySelectorAll(".tx2-field[data-key]");
    fields.forEach(function (f) {
      var key = f.getAttribute("data-key");
      if (!key) { return; }
      var val = sessionStorage.getItem("tx2." + key);
      if (val !== null) { f.value = val; }
      f.addEventListener("change", syncFields);
      f.addEventListener("input", syncFields);
    });
  }

  window.TX2 = window.TX2 || {};
  bindButtons();
  bindKeyboard();
  restoreFields();
})();
