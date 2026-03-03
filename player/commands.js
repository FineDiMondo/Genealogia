(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  var CORE = global.GN370_PLAYER_CORE;

  if (!CORE) {
    throw new Error("PLAYER_CORE_MISSING");
  }

  var TRACK_COUNTER = 0;
  var loadedTrackId = "";

  function nextTrackId() {
    TRACK_COUNTER += 1;
    return "TRK" + String(TRACK_COUNTER).padStart(4, "0");
  }

  function toRecord(rc, rsn, msg) {
    var snap = GN370.PLAYER_STATE.snapshot();
    var rec = CORE.formatRecord(snap, rc, rsn, msg);
    GN370.PLAYER_STATE.setLast(rc, rsn, msg || "OK");
    return {
      rc: rc,
      rsn: rsn,
      snapshot: snap,
      record: rec,
      lines: [rec]
    };
  }

  function withMetrics() {
    var metrics = GN370.PLAYER_ENGINE.metrics();
    GN370.PLAYER_STATE.setPlaybackMetrics(metrics);
  }

  function reasonFromError(err, cmd) {
    var msg = String(err && err.message ? err.message : err).toUpperCase();
    if (msg.indexOf("NOT_FLAC") >= 0) {
      return CORE.RSN.NOT_FLAC;
    }
    if (msg.indexOf("UNSUPPORTED") >= 0 || msg.indexOf("AUDIO_CONTEXT") >= 0) {
      return CORE.RSN.UNSUPPORTED;
    }
    if (msg.indexOf("DECODE") >= 0 || msg.indexOf("BUFFER_NOT_READY") >= 0) {
      return CORE.RSN.DECODE_FAIL;
    }
    if (msg.indexOf("OUT_OF_RANGE") >= 0) {
      return CORE.RSN.OUT_OF_RANGE;
    }
    if (msg.indexOf("EMPTY") >= 0) {
      return CORE.RSN.EMPTY_LIST;
    }
    if (String(cmd || "").toUpperCase() === "LOAD") {
      return CORE.RSN.LOAD_FAIL;
    }
    return CORE.RSN.BAD_ARG;
  }

  function makeTrackFromLoadArg(arg, localFile) {
    var textArg = String(arg || "").trim();
    var isLocal = !!localFile;
    var label = isLocal ? String(localFile.name || "local.flac") : textArg;
    var mime = isLocal ? String(localFile.type || "") : "";

    var extOk = CORE.isFlacExtension(label) || CORE.isFlacExtension(textArg);
    var mimeOk = CORE.isFlacMime(mime);

    if (!(extOk || mimeOk)) {
      throw new Error("NOT_FLAC");
    }

    return {
      id: nextTrackId(),
      label: label,
      uri: isLocal ? GN370.PLAYER_ENGINE.registerLocalFile(localFile) : textArg,
      sourceType: isLocal ? "local" : "remote",
      mime: mime || "audio/flac"
    };
  }

  function requireTrackList() {
    var list = GN370.PLAYER_STATE.getPlaylist();
    if (!list.length) {
      throw new Error("EMPTY_LIST");
    }
    return list;
  }

  function helpLines(result) {
    result.lines.push("CMDS=PLS|LOAD_<path|url|uri>|PLAY_[index]|PAUSE|STOP|SEEK_<sec>|NEXT|PREV|STAT|HELP");
    return result;
  }

  async function cmdLoad(args, options) {
    if (!args.length && !options.localFile) {
      return toRecord(CORE.RC.ERROR, CORE.RSN.BAD_ARG, "BAD_ARG");
    }

    try {
      var track = makeTrackFromLoadArg(args[0], options.localFile);
      var index = GN370.PLAYER_STATE.addTrack(track);
      GN370.PLAYER_STATE.setCurrentIndex(index);
      var metrics = await GN370.PLAYER_ENGINE.load(track);
      GN370.PLAYER_STATE.setPlaybackMetrics(metrics);
      GN370.PLAYER_STATE.setState("LOADED");
      loadedTrackId = track.id;
      return toRecord(CORE.RC.OK, CORE.RSN.NONE, "LOAD_OK");
    } catch (e) {
      GN370.PLAYER_STATE.setState("ERROR");
      return toRecord(CORE.RC.ERROR, reasonFromError(e, "LOAD"), "LOAD_FAIL");
    }
  }

  async function ensureLoadedByIndex(index) {
    var list = requireTrackList();
    var idx = index;
    if (idx == null) {
      idx = GN370.PLAYER_STATE.getRaw().currentIndex;
    }
    if (!Number.isInteger(idx) || idx < 0 || idx >= list.length) {
      throw new Error("OUT_OF_RANGE");
    }

    GN370.PLAYER_STATE.setCurrentIndex(idx);
    var track = GN370.PLAYER_STATE.currentTrack();
    if (!track) {
      throw new Error("EMPTY_LIST");
    }

    if (loadedTrackId !== track.id) {
      var metrics = await GN370.PLAYER_ENGINE.load(track);
      GN370.PLAYER_STATE.setPlaybackMetrics(metrics);
      loadedTrackId = track.id;
    }

    return track;
  }

  async function cmdPlay(args) {
    try {
      var requested = null;
      if (args.length) {
        requested = Number(args[0]);
        if (!Number.isInteger(requested) || requested <= 0) {
          throw new Error("BAD_ARG");
        }
        requested -= 1;
      }

      await ensureLoadedByIndex(requested);
      var snapBefore = GN370.PLAYER_STATE.snapshot();
      var metrics = await GN370.PLAYER_ENGINE.play(snapBefore.timeSec || 0);
      GN370.PLAYER_STATE.setPlaybackMetrics(metrics);
      GN370.PLAYER_STATE.setState("PLAYING");
      return toRecord(CORE.RC.OK, CORE.RSN.NONE, "PLAY_OK");
    } catch (e) {
      GN370.PLAYER_STATE.setState("ERROR");
      return toRecord(CORE.RC.ERROR, reasonFromError(e, "PLAY"), "PLAY_FAIL");
    }
  }

  async function cmdPause() {
    try {
      withMetrics();
      var status = GN370.PLAYER_STATE.snapshot().state;
      if (status !== "PLAYING") {
        return toRecord(CORE.RC.WARN, CORE.RSN.BAD_ARG, "NOT_PLAYING");
      }
      var metrics = GN370.PLAYER_ENGINE.pause();
      GN370.PLAYER_STATE.setPlaybackMetrics(metrics);
      GN370.PLAYER_STATE.setState("PAUSED");
      return toRecord(CORE.RC.OK, CORE.RSN.NONE, "PAUSE_OK");
    } catch (e) {
      return toRecord(CORE.RC.ERROR, reasonFromError(e, "PAUSE"), "PAUSE_FAIL");
    }
  }

  async function cmdStop() {
    try {
      var metrics = GN370.PLAYER_ENGINE.stop();
      metrics.timeSec = 0;
      GN370.PLAYER_STATE.setPlaybackMetrics(metrics);
      GN370.PLAYER_STATE.setState("STOPPED");
      return toRecord(CORE.RC.OK, CORE.RSN.NONE, "STOP_OK");
    } catch (e) {
      return toRecord(CORE.RC.ERROR, reasonFromError(e, "STOP"), "STOP_FAIL");
    }
  }

  async function cmdSeek(args) {
    if (!args.length) {
      return toRecord(CORE.RC.ERROR, CORE.RSN.BAD_ARG, "BAD_ARG");
    }

    var sec = Number(args[0]);
    if (!Number.isFinite(sec) || sec < 0) {
      return toRecord(CORE.RC.ERROR, CORE.RSN.BAD_ARG, "BAD_ARG");
    }

    try {
      var snap = GN370.PLAYER_STATE.snapshot();
      if (snap.durationSec > 0 && sec > snap.durationSec) {
        return toRecord(CORE.RC.ERROR, CORE.RSN.OUT_OF_RANGE, "OUT_OF_RANGE");
      }
      var metrics = GN370.PLAYER_ENGINE.seek(sec);
      GN370.PLAYER_STATE.setPlaybackMetrics(metrics);
      var nextState = snap.state;
      if (snap.state !== "PLAYING" && snap.state !== "LOADED" && snap.state !== "STOPPED" && snap.state !== "PAUSED") {
        nextState = "PAUSED";
      }
      GN370.PLAYER_STATE.setState(nextState);
      return toRecord(CORE.RC.OK, CORE.RSN.NONE, "SEEK_OK");
    } catch (e) {
      return toRecord(CORE.RC.ERROR, reasonFromError(e, "SEEK"), "SEEK_FAIL");
    }
  }

  async function cmdNext() {
    try {
      requireTrackList();
      var idx = GN370.PLAYER_STATE.nextIndex();
      if (idx < 0) {
        return toRecord(CORE.RC.WARN, CORE.RSN.OUT_OF_RANGE, "OUT_OF_RANGE");
      }
      var before = GN370.PLAYER_STATE.snapshot();
      await ensureLoadedByIndex(idx);
      if (before.state === "PLAYING") {
        var metrics = await GN370.PLAYER_ENGINE.play(0);
        GN370.PLAYER_STATE.setPlaybackMetrics(metrics);
        GN370.PLAYER_STATE.setState("PLAYING");
      } else {
        GN370.PLAYER_STATE.setState("LOADED");
      }
      return toRecord(CORE.RC.OK, CORE.RSN.NONE, "NEXT_OK");
    } catch (e) {
      return toRecord(CORE.RC.ERROR, reasonFromError(e, "NEXT"), "NEXT_FAIL");
    }
  }

  async function cmdPrev() {
    try {
      requireTrackList();
      var idx = GN370.PLAYER_STATE.prevIndex();
      if (idx < 0) {
        return toRecord(CORE.RC.WARN, CORE.RSN.OUT_OF_RANGE, "OUT_OF_RANGE");
      }
      var before = GN370.PLAYER_STATE.snapshot();
      await ensureLoadedByIndex(idx);
      if (before.state === "PLAYING") {
        var metrics = await GN370.PLAYER_ENGINE.play(0);
        GN370.PLAYER_STATE.setPlaybackMetrics(metrics);
        GN370.PLAYER_STATE.setState("PLAYING");
      } else {
        GN370.PLAYER_STATE.setState("LOADED");
      }
      return toRecord(CORE.RC.OK, CORE.RSN.NONE, "PREV_OK");
    } catch (e) {
      return toRecord(CORE.RC.ERROR, reasonFromError(e, "PREV"), "PREV_FAIL");
    }
  }

  async function cmdPls() {
    var list = GN370.PLAYER_STATE.getPlaylist();
    if (!list.length) {
      return toRecord(CORE.RC.WARN, CORE.RSN.EMPTY_LIST, "EMPTY_LIST");
    }
    var result = toRecord(CORE.RC.OK, CORE.RSN.NONE, "PLS_OK");
    for (var i = 0; i < list.length; i += 1) {
      result.lines.push("TRACK=" + String(i + 1).padStart(2, "0") + " FILE=" + String(list[i].label).replace(/\s+/g, "_") + " SRC=" + String(list[i].sourceType || "remote").toUpperCase());
    }
    return result;
  }

  async function cmdStat() {
    withMetrics();
    return toRecord(CORE.RC.OK, CORE.RSN.NONE, "STAT_OK");
  }

  function canHandle(rawOrTokens) {
    var raw = Array.isArray(rawOrTokens) ? rawOrTokens.join(" ") : rawOrTokens;
    var parsed = CORE.parse(raw);
    return CORE.isKnownCommand(parsed.cmd);
  }

  async function execute(raw, options) {
    var opts = options || {};
    if (GN370.PLAYER_ENGINE && typeof GN370.PLAYER_ENGINE.init === "function") {
      GN370.PLAYER_ENGINE.init();
    }

    var parsed = CORE.parse(raw);
    var cmd = parsed.cmd;
    var args = parsed.args;
    var result;

    if (!CORE.isKnownCommand(cmd)) {
      result = toRecord(CORE.RC.ERROR, CORE.RSN.BAD_CMD, "BAD_CMD");
    } else if (cmd === "HELP") {
      result = helpLines(toRecord(CORE.RC.OK, CORE.RSN.NONE, "HELP"));
    } else if (cmd === "STAT") {
      result = await cmdStat();
    } else if (cmd === "PLS") {
      result = await cmdPls();
    } else if (cmd === "LOAD") {
      result = await cmdLoad(args, opts);
    } else if (cmd === "PLAY") {
      result = await cmdPlay(args);
    } else if (cmd === "PAUSE") {
      result = await cmdPause();
    } else if (cmd === "STOP") {
      result = await cmdStop();
    } else if (cmd === "SEEK") {
      result = await cmdSeek(args);
    } else if (cmd === "NEXT") {
      result = await cmdNext();
    } else if (cmd === "PREV") {
      result = await cmdPrev();
    } else {
      result = toRecord(CORE.RC.ERROR, CORE.RSN.BAD_CMD, "BAD_CMD");
    }

    GN370.PLAYER_STATE.appendLog({
      cmd: cmd,
      rc: result.rc,
      rsn: result.rsn,
      out: result.record
    });

    return result;
  }

  GN370.PLAYER_COMMANDS = {
    canHandle: canHandle,
    execute: execute,
    rc: CORE.RC,
    rsn: CORE.RSN,
    helpText: "PLS | LOAD <path|url|uri> | PLAY [index] | PAUSE | STOP | SEEK <sec> | NEXT | PREV | STAT | HELP"
  };
}(window));
