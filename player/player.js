(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};

  function byId(id) {
    return document.getElementById(id);
  }

  function padTime(sec) {
    var n = Math.max(0, Math.floor(Number(sec || 0)));
    var m = Math.floor(n / 60);
    var s = n % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function line(logEl, text, cls) {
    var value = String(text || "");
    if (!logEl) {
      return;
    }
    if (cls) {
      logEl.innerHTML += "<span class=\"" + cls + "\">" + value.replace(/</g, "&lt;") + "</span>\n";
    } else {
      logEl.textContent += value + "\n";
    }
    logEl.scrollTop = logEl.scrollHeight;
  }

  function renderFields() {
    var snap = GN370.PLAYER_STATE.snapshot();
    byId("pl-file").textContent = snap.file;
    byId("pl-state").textContent = snap.state;
    byId("pl-time").textContent = padTime(snap.timeSec);
    byId("pl-duration").textContent = padTime(snap.durationSec);
    byId("pl-sr").textContent = String(snap.sampleRate);
    byId("pl-bit").textContent = String(snap.bitDepth);
    byId("pl-ch").textContent = String(snap.channels);
    byId("pl-vol").textContent = String(snap.volume);

    var playBtn = byId("pf-play");
    playBtn.textContent = snap.state === "PLAYING" ? "PAUSE" : "PLAY";
  }

  async function run(raw, opts) {
    var output = byId("pl-log");
    var cmd = String(raw || "").trim();
    if (!cmd) {
      return;
    }

    var result = await GN370.PLAYER_COMMANDS.execute(cmd, opts || {});
    var cls = result.rc >= GN370.PLAYER_COMMANDS.rc.ERROR ? "line-error" : (result.rc >= GN370.PLAYER_COMMANDS.rc.WARN ? "line-warn" : "line-ok");
    for (var i = 0; i < result.lines.length; i += 1) {
      line(output, result.lines[i], i === 0 ? cls : "");
    }
    renderFields();
  }

  function renderStoredLogs() {
    var output = byId("pl-log");
    var logs = GN370.PLAYER_STATE.readLogs(20);
    for (var i = 0; i < logs.length; i += 1) {
      line(output, logs[i].ts + " " + logs[i].out);
    }
  }

  function bind() {
    var cmdInput = byId("pl-cmd");
    var cmdRun = byId("pl-run");
    var fileInput = byId("pl-file-input");

    cmdRun.addEventListener("click", function () {
      var raw = cmdInput.value;
      cmdInput.value = "";
      run(raw);
    });

    cmdInput.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        cmdRun.click();
      }
    });

    fileInput.addEventListener("change", function () {
      if (!fileInput.files || !fileInput.files.length) {
        return;
      }
      var file = fileInput.files[0];
      run("LOAD " + file.name, { localFile: file });
    });

    byId("pf-prev").addEventListener("click", function () { run("PREV"); });
    byId("pf-play").addEventListener("click", function () {
      var snap = GN370.PLAYER_STATE.snapshot();
      run(snap.state === "PLAYING" ? "PAUSE" : "PLAY");
    });
    byId("pf-next").addEventListener("click", function () { run("NEXT"); });
    byId("pf-stop").addEventListener("click", function () { run("STOP"); });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "F7") { ev.preventDefault(); run("PREV"); }
      if (ev.key === "F8") { ev.preventDefault();
        var snap = GN370.PLAYER_STATE.snapshot();
        run(snap.state === "PLAYING" ? "PAUSE" : "PLAY");
      }
      if (ev.key === "F9") { ev.preventDefault(); run("NEXT"); }
      if (ev.key === "F10") { ev.preventDefault(); run("STOP"); }
    });
  }

  function startRefresh() {
    setInterval(function () {
      try {
        GN370.PLAYER_STATE.setPlaybackMetrics(GN370.PLAYER_ENGINE.metrics());
      } catch (_) {}
      renderFields();
    }, 1000);
  }

  function init() {
    if (!byId("pl-screen")) {
      return;
    }
    GN370.PLAYER_ENGINE.init();
    renderStoredLogs();
    renderFields();
    bind();
    startRefresh();
    run("HELP");
    run("STAT");
  }

  document.addEventListener("DOMContentLoaded", init);
}(window));
