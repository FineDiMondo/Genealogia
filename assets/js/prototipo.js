(function (global) {
  "use strict";

  var MAP_NAMES = {
    "1": "ALBERO GENEALOGICO",
    "2": "RETE DELLE FAMIGLIE",
    "3": "CRONOLOGIA DEGLI EVENTI",
    "4": "MAPPA DEI LUOGHI",
    "5": "GERARCHIA DEI TITOLI",
    "6": "DISTRIBUZIONE DELLE PROPRIETA",
    "7": "ANALISI DELLE RELAZIONI",
    "8": "SUGGERIMENTI IA",
    "9": "9 MONDI - YGGDRASIL"
  };

  var VARIANTS = ["A", "B", "C", "D"];
  var VARIANT_LABELS = {
    A: "ORIZZONTALE",
    B: "VERTICALE",
    C: "WIREFRAME",
    D: "ASCII-370"
  };

  var ALLOWED_SKINS = ["risorgimentale", "pergamena", "telegrafo"];

  var state = {
    mapId: "1",
    variant: "A",
    skin: "risorgimentale",
    maps: {}
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function splitNonEmpty(raw) {
    return String(raw || "").split("&").filter(function (part) {
      return part.length > 0;
    });
  }

  function parseHashState() {
    var hash = String(global.location.hash || "");
    if (!hash || hash.length < 2) {
      return;
    }
    splitNonEmpty(hash.slice(1)).forEach(function (pair) {
      var parts = pair.split("=");
      var key = decodeURIComponent(parts[0] || "").toLowerCase();
      var value = decodeURIComponent(parts[1] || "");
      if (key === "map" && /^[1-9]$/.test(value)) {
        state.mapId = value;
      } else if (key === "variant" && /^[A-D]$/i.test(value)) {
        state.variant = value.toUpperCase();
      } else if (key === "skin" && ALLOWED_SKINS.indexOf(value) >= 0) {
        state.skin = value;
      }
    });
  }

  function setHashState() {
    var next = "#map=" + encodeURIComponent(state.mapId)
      + "&variant=" + encodeURIComponent(state.variant)
      + "&skin=" + encodeURIComponent(state.skin);
    if (String(global.location.hash || "") !== next && global.history && typeof global.history.replaceState === "function") {
      global.history.replaceState(null, "", next);
    }
  }

  async function fetchMapText() {
    var candidates = [
      "../assets/maps/gn370_mappe_ascii.txt",
      "/assets/maps/gn370_mappe_ascii.txt",
      "assets/maps/gn370_mappe_ascii.txt"
    ];
    var i;
    for (i = 0; i < candidates.length; i += 1) {
      try {
        var res = await fetch(candidates[i], { cache: "no-store" });
        if (res.ok) {
          return await res.text();
        }
      } catch (_) {
        // try next candidate
      }
    }
    throw new Error("MAP_SOURCE_NOT_FOUND");
  }

  function trimBlock(text) {
    return String(text || "").replace(/^\n+/, "").replace(/\n+$/, "");
  }

  function parseMaps(text) {
    var lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
    var maps = {};
    var currentMap = "";
    var currentVariant = "";
    var buffer = [];

    function flushBuffer() {
      if (!currentMap || !currentVariant) {
        return;
      }
      if (!maps[currentMap]) {
        maps[currentMap] = {};
      }
      maps[currentMap][currentVariant] = trimBlock(buffer.join("\n"));
      buffer = [];
    }

    lines.forEach(function (line) {
      var mapMatch = /^###\s+MAPPA\s+([1-9])\s*$/i.exec(line);
      if (mapMatch) {
        flushBuffer();
        currentMap = mapMatch[1];
        currentVariant = "";
        return;
      }

      var variantMatch = /^####\s+([1-9])([A-D])\s*$/i.exec(line);
      if (variantMatch) {
        flushBuffer();
        currentMap = variantMatch[1];
        currentVariant = variantMatch[2].toUpperCase();
        return;
      }

      if (currentVariant) {
        buffer.push(line);
      }
    });

    flushBuffer();
    return maps;
  }

  function mapIds() {
    return Object.keys(state.maps).sort(function (a, b) {
      return Number(a) - Number(b);
    });
  }

  function firstAvailableVariant(mapId) {
    var variants = state.maps[mapId] || {};
    var i;
    for (i = 0; i < VARIANTS.length; i += 1) {
      if (variants[VARIANTS[i]]) {
        return VARIANTS[i];
      }
    }
    return "A";
  }

  function ensureValidState() {
    var ids = mapIds();
    if (!ids.length) {
      state.mapId = "1";
      state.variant = "A";
      return;
    }

    if (!state.maps[state.mapId]) {
      state.mapId = ids[0];
    }

    if (!state.maps[state.mapId][state.variant]) {
      state.variant = firstAvailableVariant(state.mapId);
    }

    if (ALLOWED_SKINS.indexOf(state.skin) < 0) {
      state.skin = "risorgimentale";
    }
  }

  function renderMapTabs() {
    var target = byId("proto-map-tabs");
    if (!target) {
      return;
    }
    target.innerHTML = "";
    mapIds().forEach(function (id) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "proto-tab";
      btn.setAttribute("role", "tab");
      btn.setAttribute("data-map", id);
      btn.textContent = "Mappa " + id;
      target.appendChild(btn);
    });
  }

  function renderVariantTabs() {
    var target = byId("proto-variant-tabs");
    if (!target) {
      return;
    }
    target.innerHTML = "";
    VARIANTS.forEach(function (variant) {
      var available = !!(state.maps[state.mapId] && state.maps[state.mapId][variant]);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "proto-tab";
      btn.setAttribute("role", "tab");
      btn.setAttribute("data-variant", variant);
      btn.textContent = variant + " · " + VARIANT_LABELS[variant];
      btn.disabled = !available;
      target.appendChild(btn);
    });
  }

  function paintActiveTabs() {
    document.querySelectorAll("[data-map]").forEach(function (node) {
      var active = node.getAttribute("data-map") === state.mapId;
      node.setAttribute("aria-selected", active ? "true" : "false");
      node.classList.toggle("is-active", active);
    });

    document.querySelectorAll("[data-variant]").forEach(function (node) {
      var active = node.getAttribute("data-variant") === state.variant;
      node.setAttribute("aria-selected", active ? "true" : "false");
      node.classList.toggle("is-active", active);
    });

    document.querySelectorAll("[data-skin]").forEach(function (node) {
      var active = node.getAttribute("data-skin") === state.skin;
      node.setAttribute("aria-selected", active ? "true" : "false");
      node.classList.toggle("is-active", active);
    });
  }

  function setSkin() {
    document.body.setAttribute("data-skin", state.skin);
  }

  function maxCols(lines) {
    var max = 0;
    lines.forEach(function (line) {
      if (line.length > max) {
        max = line.length;
      }
    });
    return max;
  }

  function renderCanvas() {
    var content;
    if (state.maps[state.mapId] && state.maps[state.mapId][state.variant]) {
      content = state.maps[state.mapId][state.variant];
    } else {
      content = "Contenuto non disponibile per questa variante.";
    }

    var canvas = byId("proto-canvas");
    if (canvas) {
      canvas.textContent = content;
    }

    var lines = content.split(/\r?\n/);
    var rowCount = byId("proto-row-count");
    if (rowCount) {
      rowCount.textContent = String(lines.length);
    }
    var colCount = byId("proto-col-count");
    if (colCount) {
      colCount.textContent = String(maxCols(lines)) + " col";
    }
  }

  function renderMeta() {
    var title = byId("proto-map-title");
    if (title) {
      title.textContent = "MAPPA " + state.mapId + " · " + (MAP_NAMES[state.mapId] || "CONTENUTO");
    }

    var sub = byId("proto-map-subtitle");
    if (sub) {
      sub.textContent = "Anteprima " + (VARIANT_LABELS[state.variant] || state.variant)
        + " · resa web-only con skin " + state.skin + ".";
    }

    var variantLabel = byId("proto-variant-label");
    if (variantLabel) {
      variantLabel.textContent = state.variant + " · " + (VARIANT_LABELS[state.variant] || "");
    }
  }

  function render() {
    ensureValidState();
    renderMapTabs();
    renderVariantTabs();
    paintActiveTabs();
    setSkin();
    renderMeta();
    renderCanvas();
    setHashState();
  }

  function bindEvents() {
    document.addEventListener("click", function (ev) {
      var target = ev.target;
      if (!target) {
        return;
      }

      var mapId = target.getAttribute("data-map");
      if (mapId) {
        state.mapId = mapId;
        state.variant = firstAvailableVariant(mapId);
        render();
        return;
      }

      var variant = target.getAttribute("data-variant");
      if (variant) {
        if (state.maps[state.mapId] && state.maps[state.mapId][variant]) {
          state.variant = variant;
          render();
        }
        return;
      }

      var skin = target.getAttribute("data-skin");
      if (skin && ALLOWED_SKINS.indexOf(skin) >= 0) {
        state.skin = skin;
        render();
      }
    });
  }

  function showError(message) {
    var title = byId("proto-map-title");
    if (title) {
      title.textContent = "Errore caricamento prototipo";
    }
    var canvas = byId("proto-canvas");
    if (canvas) {
      canvas.textContent = String(message || "Errore sconosciuto");
    }
  }

  async function boot() {
    parseHashState();
    bindEvents();
    try {
      var source = await fetchMapText();
      state.maps = parseMaps(source);
      render();
    } catch (err) {
      showError(err && err.message ? err.message : String(err));
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})(window);
