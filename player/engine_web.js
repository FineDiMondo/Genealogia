(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};

  var htmlAudio = null;
  var localFileMap = {};
  var localCounter = 0;

  var audioCtx = null;
  var gainNode = null;
  var fallbackBuffer = null;
  var fallbackSource = null;
  var fallbackPlaying = false;
  var fallbackOffsetSec = 0;
  var fallbackStartedAt = 0;

  var engineState = {
    initialized: false,
    mode: "NONE",
    activeTrackId: "",
    lastError: ""
  };

  function ensureHtmlAudio() {
    if (!htmlAudio) {
      htmlAudio = new Audio();
      htmlAudio.preload = "metadata";
      htmlAudio.crossOrigin = "anonymous";
    }
    return htmlAudio;
  }

  function canUseHtmlFlac() {
    var probe = ensureHtmlAudio();
    return !!(probe.canPlayType("audio/flac") || probe.canPlayType("audio/x-flac"));
  }

  function ensureAudioContext() {
    if (!audioCtx) {
      var Ctx = global.AudioContext || global.webkitAudioContext;
      if (!Ctx) {
        throw new Error("UNSUPPORTED_AUDIO_CONTEXT");
      }
      audioCtx = new Ctx();
      gainNode = audioCtx.createGain();
      gainNode.gain.value = 1;
      gainNode.connect(audioCtx.destination);
    }
    return audioCtx;
  }

  function revokeLocalUrl(id) {
    var slot = localFileMap[id];
    if (slot && slot.objectUrl) {
      try { URL.revokeObjectURL(slot.objectUrl); } catch (_) {}
      slot.objectUrl = "";
    }
  }

  function registerLocalFile(file) {
    localCounter += 1;
    var id = "LOCAL_" + Date.now() + "_" + localCounter;
    localFileMap[id] = {
      file: file,
      objectUrl: ""
    };
    return id;
  }

  function getTrackSource(track) {
    if (!track) {
      throw new Error("TRACK_MISSING");
    }
    if (track.sourceType === "local") {
      var slot = localFileMap[track.uri];
      if (!slot || !slot.file) {
        throw new Error("LOCAL_FILE_NOT_FOUND");
      }
      if (!slot.objectUrl) {
        slot.objectUrl = URL.createObjectURL(slot.file);
      }
      return slot.objectUrl;
    }
    return track.uri;
  }

  function getTrackArrayBuffer(track) {
    if (track.sourceType === "local") {
      var slot = localFileMap[track.uri];
      if (!slot || !slot.file) {
        return Promise.reject(new Error("LOCAL_FILE_NOT_FOUND"));
      }
      return slot.file.arrayBuffer();
    }
    return fetch(track.uri, { cache: "no-store" }).then(function (res) {
      if (!res.ok) {
        throw new Error("FETCH_FAILED_" + res.status);
      }
      return res.arrayBuffer();
    });
  }

  function fallbackCurrentTime() {
    if (!fallbackBuffer) {
      return 0;
    }
    if (!fallbackPlaying) {
      return fallbackOffsetSec;
    }
    var current = ensureAudioContext().currentTime - fallbackStartedAt;
    return Math.max(0, Math.min(current, fallbackBuffer.duration || 0));
  }

  function stopFallbackSource() {
    if (fallbackSource) {
      try { fallbackSource.stop(); } catch (_) {}
      try { fallbackSource.disconnect(); } catch (_) {}
      fallbackSource = null;
    }
  }

  function startFallbackAt(sec) {
    if (!fallbackBuffer) {
      throw new Error("BUFFER_NOT_READY");
    }
    var ctx = ensureAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    stopFallbackSource();

    var offset = Math.max(0, Math.min(sec || 0, fallbackBuffer.duration || 0));
    var src = ctx.createBufferSource();
    src.buffer = fallbackBuffer;
    src.connect(gainNode);
    src.onended = function () {
      if (fallbackPlaying) {
        fallbackPlaying = false;
        fallbackOffsetSec = 0;
      }
    };
    src.start(0, offset);

    fallbackSource = src;
    fallbackPlaying = true;
    fallbackStartedAt = ctx.currentTime - offset;
    fallbackOffsetSec = offset;
  }

  function metrics(mode, volume) {
    if (mode === "AUDIO_TAG") {
      var a = ensureHtmlAudio();
      return {
        timeSec: Math.floor(Number(a.currentTime || 0)),
        durationSec: Math.floor(Number(isFinite(a.duration) ? a.duration : 0)),
        sampleRate: 0,
        bitDepth: 0,
        channels: 0,
        volume: Math.max(0, Math.min(100, Math.floor(Number(volume))))
      };
    }

    if (mode === "WEBAUDIO") {
      var dur = fallbackBuffer ? Number(fallbackBuffer.duration || 0) : 0;
      return {
        timeSec: Math.floor(fallbackCurrentTime()),
        durationSec: Math.floor(dur),
        sampleRate: fallbackBuffer ? Math.floor(Number(fallbackBuffer.sampleRate || 0)) : 0,
        bitDepth: 0,
        channels: fallbackBuffer ? Math.floor(Number(fallbackBuffer.numberOfChannels || 0)) : 0,
        volume: Math.max(0, Math.min(100, Math.floor(Number(volume))))
      };
    }

    return {
      timeSec: 0,
      durationSec: 0,
      sampleRate: 0,
      bitDepth: 0,
      channels: 0,
      volume: Math.max(0, Math.min(100, Math.floor(Number(volume))))
    };
  }

  async function loadFallback(track) {
    var ctx = ensureAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    var data = await getTrackArrayBuffer(track);
    var decoded = await ctx.decodeAudioData(data.slice(0));
    fallbackBuffer = decoded;
    fallbackOffsetSec = 0;
    fallbackPlaying = false;
    stopFallbackSource();
    return metrics("WEBAUDIO", volume());
  }

  function volume() {
    if (engineState.mode === "AUDIO_TAG") {
      return Math.floor((ensureHtmlAudio().volume || 1) * 100);
    }
    if (gainNode) {
      return Math.floor(Number(gainNode.gain.value || 1) * 100);
    }
    return 100;
  }

  function init() {
    ensureHtmlAudio();
    engineState.initialized = true;
    engineState.mode = canUseHtmlFlac() ? "AUDIO_TAG" : "WEBAUDIO";
    engineState.lastError = "";
    return {
      mode: engineState.mode,
      htmlFlac: canUseHtmlFlac()
    };
  }

  async function load(track) {
    if (!engineState.initialized) {
      init();
    }
    engineState.activeTrackId = track && track.id ? track.id : "";
    engineState.lastError = "";

    try {
      if (canUseHtmlFlac()) {
        var audio = ensureHtmlAudio();
        audio.pause();
        audio.src = getTrackSource(track);
        audio.currentTime = 0;
        audio.load();
        engineState.mode = "AUDIO_TAG";
        return metrics(engineState.mode, volume());
      }

      engineState.mode = "WEBAUDIO";
      return await loadFallback(track);
    } catch (e) {
      engineState.lastError = e && e.message ? e.message : String(e);
      throw e;
    }
  }

  async function play(sec) {
    if (!engineState.initialized) {
      init();
    }
    var at = Math.max(0, Number(sec || 0));

    if (engineState.mode === "AUDIO_TAG") {
      var audio = ensureHtmlAudio();
      if (at > 0 && isFinite(audio.duration || 0)) {
        audio.currentTime = Math.min(at, Number(audio.duration || at));
      }
      await audio.play();
      return metrics("AUDIO_TAG", volume());
    }

    if (!fallbackBuffer) {
      throw new Error("BUFFER_NOT_READY");
    }
    startFallbackAt(at || fallbackOffsetSec);
    return metrics("WEBAUDIO", volume());
  }

  function pause() {
    if (engineState.mode === "AUDIO_TAG") {
      ensureHtmlAudio().pause();
      return metrics("AUDIO_TAG", volume());
    }
    if (fallbackPlaying) {
      fallbackOffsetSec = fallbackCurrentTime();
      fallbackPlaying = false;
      stopFallbackSource();
    }
    return metrics("WEBAUDIO", volume());
  }

  function stop() {
    if (engineState.mode === "AUDIO_TAG") {
      var audio = ensureHtmlAudio();
      audio.pause();
      audio.currentTime = 0;
      return metrics("AUDIO_TAG", volume());
    }
    fallbackOffsetSec = 0;
    fallbackPlaying = false;
    stopFallbackSource();
    return metrics("WEBAUDIO", volume());
  }

  function seek(sec) {
    var at = Math.max(0, Number(sec || 0));
    if (engineState.mode === "AUDIO_TAG") {
      var audio = ensureHtmlAudio();
      var dur = Number(audio.duration || 0);
      if (dur > 0) {
        audio.currentTime = Math.min(at, dur);
      } else {
        audio.currentTime = at;
      }
      return metrics("AUDIO_TAG", volume());
    }

    if (!fallbackBuffer) {
      throw new Error("BUFFER_NOT_READY");
    }

    var bounded = Math.min(at, Number(fallbackBuffer.duration || at));
    if (fallbackPlaying) {
      startFallbackAt(bounded);
    } else {
      fallbackOffsetSec = bounded;
    }
    return metrics("WEBAUDIO", volume());
  }

  function setVolume(percent) {
    var vol = Math.max(0, Math.min(100, Math.floor(Number(percent))));
    if (engineState.mode === "AUDIO_TAG") {
      ensureHtmlAudio().volume = vol / 100;
      return metrics("AUDIO_TAG", vol);
    }
    if (gainNode) {
      gainNode.gain.value = vol / 100;
    }
    return metrics(engineState.mode, vol);
  }

  function status() {
    return {
      initialized: engineState.initialized,
      mode: engineState.mode,
      activeTrackId: engineState.activeTrackId,
      htmlFlac: canUseHtmlFlac(),
      lastError: engineState.lastError
    };
  }

  GN370.PLAYER_ENGINE = {
    init: init,
    canUseHtmlFlac: canUseHtmlFlac,
    registerLocalFile: registerLocalFile,
    revokeLocalUrl: revokeLocalUrl,
    load: load,
    play: play,
    pause: pause,
    stop: stop,
    seek: seek,
    setVolume: setVolume,
    metrics: function () { return metrics(engineState.mode, volume()); },
    status: status
  };
}(window));
