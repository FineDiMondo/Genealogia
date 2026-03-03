(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.GN370_PLAYER_CORE = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var RC = {
    OK: 0,
    WARN: 4,
    ERROR: 8,
    FATAL: 12
  };

  var RSN = {
    NONE: 0,
    NOT_FLAC: 1001,
    LOAD_FAIL: 1002,
    DECODE_FAIL: 1003,
    UNSUPPORTED: 1004,
    BAD_CMD: 1005,
    BAD_ARG: 1006,
    OUT_OF_RANGE: 1007,
    EMPTY_LIST: 1008
  };

  var COMMANDS = ["PLS", "LOAD", "PLAY", "PAUSE", "STOP", "SEEK", "NEXT", "PREV", "STAT", "HELP"];

  function pad2(n) {
    var v = String(Number(n) || 0);
    return v.length >= 2 ? v : ("0" + v);
  }

  function tokenize(raw) {
    var t = String(raw || "").trim();
    return t ? t.split(/\s+/).filter(Boolean) : [];
  }

  function parse(raw) {
    var parts = tokenize(raw);
    var cmd = (parts[0] || "").toUpperCase();
    return {
      raw: String(raw || ""),
      cmd: cmd,
      args: parts.slice(1)
    };
  }

  function isKnownCommand(cmd) {
    return COMMANDS.indexOf(String(cmd || "").toUpperCase()) >= 0;
  }

  function isFlacExtension(pathLike) {
    var input = String(pathLike || "").trim().replace(/^['"]|['"]$/g, "");
    if (!input) {
      return false;
    }
    return /\.flac(?:$|[?#])/i.test(input);
  }

  function isFlacMime(mime) {
    var m = String(mime || "").trim().toLowerCase();
    if (!m) {
      return false;
    }
    var base = m.split(";")[0].trim();
    return base === "audio/flac" || base === "audio/x-flac";
  }

  function token(value, fallback) {
    var raw = value == null ? (fallback || "-") : String(value);
    var compact = raw.replace(/\s+/g, "_").replace(/[\r\n\t]+/g, "_");
    return compact || (fallback || "-");
  }

  function asNumber(value, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n)) {
      return fallback;
    }
    return n;
  }

  function normalizeSnapshot(snapshot) {
    var src = snapshot || {};
    var trackIndex = asNumber(src.trackIndex, -1);
    if (!Number.isInteger(trackIndex)) {
      trackIndex = Math.floor(trackIndex);
    }
    return {
      state: token(src.state, "IDLE"),
      trackIndex: trackIndex,
      timeSec: Math.max(0, Math.floor(asNumber(src.timeSec, 0))),
      durationSec: Math.max(0, Math.floor(asNumber(src.durationSec, 0))),
      sampleRate: Math.max(0, Math.floor(asNumber(src.sampleRate, 0))),
      bitDepth: Math.max(0, Math.floor(asNumber(src.bitDepth, 0))),
      channels: Math.max(0, Math.floor(asNumber(src.channels, 0))),
      volume: Math.max(0, Math.min(100, Math.floor(asNumber(src.volume, 100)))),
      file: token(src.file, "-")
    };
  }

  function formatRecord(snapshot, rc, rsn, msg) {
    var s = normalizeSnapshot(snapshot);
    var trackNo = s.trackIndex >= 0 ? pad2(s.trackIndex + 1) : "00";
    var message = token(msg, "OK");
    return [
      "RC=" + asNumber(rc, RC.ERROR),
      "RSN=" + asNumber(rsn, RSN.NONE),
      "STATE=" + s.state,
      "TRACK=" + trackNo,
      "TIME=" + s.timeSec,
      "DUR=" + s.durationSec,
      "SR=" + s.sampleRate,
      "BIT=" + s.bitDepth,
      "CH=" + s.channels,
      "VOL=" + s.volume,
      "FILE=" + s.file,
      "MSG=" + message
    ].join(" ");
  }

  return {
    RC: RC,
    RSN: RSN,
    COMMANDS: COMMANDS.slice(),
    parse: parse,
    tokenize: tokenize,
    isKnownCommand: isKnownCommand,
    isFlacExtension: isFlacExtension,
    isFlacMime: isFlacMime,
    normalizeSnapshot: normalizeSnapshot,
    formatRecord: formatRecord
  };
}));
