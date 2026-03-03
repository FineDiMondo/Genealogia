(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  var LOG_STORAGE_KEY = "GN370_PLAYER_LOG";
  var LOG_LIMIT = 300;

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function initialState() {
    return {
      state: "IDLE",
      playlist: [],
      currentIndex: -1,
      timeSec: 0,
      durationSec: 0,
      sampleRate: 0,
      bitDepth: 0,
      channels: 0,
      volume: 100,
      lastRc: 0,
      lastRsn: 0,
      lastMsg: "INIT",
      logs: []
    };
  }

  function loadStoredLogs() {
    try {
      var raw = global.localStorage ? global.localStorage.getItem(LOG_STORAGE_KEY) : "";
      if (!raw) {
        return [];
      }
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveStoredLogs(logs) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs || []));
      }
    } catch (_) {}
  }

  var state = initialState();
  state.logs = loadStoredLogs();

  function normalizeMetrics(src) {
    var metrics = src || {};
    return {
      timeSec: Math.max(0, Math.floor(Number(metrics.timeSec || 0))),
      durationSec: Math.max(0, Math.floor(Number(metrics.durationSec || 0))),
      sampleRate: Math.max(0, Math.floor(Number(metrics.sampleRate || 0))),
      bitDepth: Math.max(0, Math.floor(Number(metrics.bitDepth || 0))),
      channels: Math.max(0, Math.floor(Number(metrics.channels || 0))),
      volume: Math.max(0, Math.min(100, Math.floor(Number(metrics.volume == null ? state.volume : metrics.volume))))
    };
  }

  function currentTrack() {
    if (state.currentIndex < 0 || state.currentIndex >= state.playlist.length) {
      return null;
    }
    return state.playlist[state.currentIndex];
  }

  function snapshot() {
    var track = currentTrack();
    return {
      state: state.state,
      trackIndex: state.currentIndex,
      file: track ? (track.label || track.uri || "-") : "-",
      timeSec: state.timeSec,
      durationSec: state.durationSec,
      sampleRate: state.sampleRate,
      bitDepth: state.bitDepth,
      channels: state.channels,
      volume: state.volume
    };
  }

  function setPlaybackMetrics(metrics) {
    var next = normalizeMetrics(metrics);
    state.timeSec = next.timeSec;
    state.durationSec = next.durationSec;
    state.sampleRate = next.sampleRate;
    state.bitDepth = next.bitDepth;
    state.channels = next.channels;
    state.volume = next.volume;
  }

  function setState(name) {
    state.state = String(name || "IDLE").toUpperCase();
  }

  function setCurrentIndex(index) {
    var idx = Number(index);
    if (!Number.isInteger(idx)) {
      return false;
    }
    if (idx < 0 || idx >= state.playlist.length) {
      return false;
    }
    state.currentIndex = idx;
    return true;
  }

  function addTrack(track) {
    var item = clone(track || {});
    if (!item.label) {
      item.label = item.uri || item.id || "TRACK";
    }
    state.playlist.push(item);
    if (state.currentIndex < 0) {
      state.currentIndex = 0;
    }
    return state.playlist.length - 1;
  }

  function getPlaylist() {
    return clone(state.playlist);
  }

  function nextIndex() {
    var candidate = state.currentIndex + 1;
    if (candidate >= 0 && candidate < state.playlist.length) {
      state.currentIndex = candidate;
      return candidate;
    }
    return -1;
  }

  function prevIndex() {
    var candidate = state.currentIndex - 1;
    if (candidate >= 0 && candidate < state.playlist.length) {
      state.currentIndex = candidate;
      return candidate;
    }
    return -1;
  }

  function setLast(rc, rsn, msg) {
    state.lastRc = Number(rc || 0);
    state.lastRsn = Number(rsn || 0);
    state.lastMsg = String(msg || "");
  }

  function appendLog(record) {
    var entry = {
      ts: nowIso(),
      cmd: record && record.cmd ? String(record.cmd).toUpperCase() : "-",
      rc: Number(record && record.rc != null ? record.rc : 0),
      rsn: Number(record && record.rsn != null ? record.rsn : 0),
      state: state.state,
      out: record && record.out ? String(record.out) : ""
    };
    state.logs.push(entry);
    if (state.logs.length > LOG_LIMIT) {
      state.logs = state.logs.slice(state.logs.length - LOG_LIMIT);
    }
    saveStoredLogs(state.logs);
    return entry;
  }

  function readLogs(limit) {
    var n = Number(limit || 0);
    if (!Number.isFinite(n) || n <= 0) {
      return clone(state.logs);
    }
    return clone(state.logs.slice(Math.max(0, state.logs.length - n)));
  }

  function clearRuntime() {
    var logs = state.logs.slice();
    state = initialState();
    state.logs = logs;
  }

  GN370.PLAYER_STATE = {
    snapshot: snapshot,
    setPlaybackMetrics: setPlaybackMetrics,
    setState: setState,
    setCurrentIndex: setCurrentIndex,
    addTrack: addTrack,
    getPlaylist: getPlaylist,
    currentTrack: currentTrack,
    nextIndex: nextIndex,
    prevIndex: prevIndex,
    setLast: setLast,
    appendLog: appendLog,
    readLogs: readLogs,
    clearRuntime: clearRuntime,
    getRaw: function () { return clone(state); }
  };
}(window));
