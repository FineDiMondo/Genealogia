(function() {
  "use strict";

  const PF_LINKS = {
    1: "index.html",
    4: "people/index.html",
    5: "families/index.html",
    6: "sources/index.html",
    7: "heraldry/index.html",
    8: "reports/index.html",
    9: "portale-chiaro.html"
  };

  const MENU_LINKS = {
    1: "people/index.html",
    2: "families/index.html",
    3: "sources/index.html",
    4: "heraldry/index.html",
    5: "reports/index.html",
    6: "portale-chiaro.html",
    9: "portale-370.html"
  };

  const state = {
    cmdBuffer: "",
    bufferTimer: null,
    mode: "370"
  };

  function getModeFromPath() {
    const p = (window.location.pathname || "").toLowerCase();
    if (p.endsWith("/portale-chiaro.html")) return "clear";
    if (p.endsWith("/portale-370.html")) return "370";
    return "";
  }

  function resolveMode() {
    const url = new URL(window.location.href);
    const q = (url.searchParams.get("view") || "").toLowerCase();
    if (q === "clear" || q === "370") return q;
    const byPath = getModeFromPath();
    if (byPath) return byPath;
    const saved = (localStorage.getItem("portal_view") || "").toLowerCase();
    if (saved === "clear" || saved === "370") return saved;
    return "370";
  }

  function portalRootPrefix() {
    const p = (window.location.pathname || "").replace(/\\/g, "/");
    const parts = p.split("/").filter(Boolean);
    if (parts.length < 2) return "";
    const parent = parts[parts.length - 2].toLowerCase();
    if (["people", "families", "sources", "heraldry", "reports", "nobilta"].includes(parent)) {
      return "../";
    }
    return "";
  }

  function resolvePortalPath(path) {
    if (!path) return path;
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
      return path;
    }
    return portalRootPrefix() + path;
  }

  function normalizePath(path) {
    return (path || "").replace(/\\/g, "/").split("/").pop().toLowerCase();
  }

  function withMode(path, mode) {
    if (!path || path.startsWith("http://") || path.startsWith("https://") || path.startsWith("#")) return path;
    const abs = new URL(path, window.location.href);
    abs.searchParams.set("view", mode);
    return abs.pathname + abs.search + abs.hash;
  }

  function showMsg(text) {
    let box = document.getElementById("terminal-msg");
    if (!box) {
      box = document.createElement("div");
      box.id = "terminal-msg";
      box.className = "terminal-msg";
      box.setAttribute("aria-live", "polite");
      document.body.appendChild(box);
    }
    box.textContent = text;
    box.classList.add("show");
    clearTimeout(box._hideTimer);
    box._hideTimer = setTimeout(function() {
      box.classList.remove("show");
    }, 1450);
  }

  function goTo(path, reason) {
    if (!path) return;
    const resolved = withMode(resolvePortalPath(path), state.mode);
    showMsg(reason ? reason + ": " + resolved : "OPEN " + resolved);
    setTimeout(function() {
      window.location.href = resolved;
    }, 50);
  }

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = (el.tagName || "").toUpperCase();
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  function clearBuffer() {
    state.cmdBuffer = "";
    if (state.bufferTimer) clearTimeout(state.bufferTimer);
    state.bufferTimer = null;
  }

  function touchBufferTimer() {
    if (state.bufferTimer) clearTimeout(state.bufferTimer);
    state.bufferTimer = setTimeout(clearBuffer, 1800);
  }

  function highlightCurrentPF() {
    const current = normalizePath(window.location.pathname);
    document.querySelectorAll(".pf-bar .pf").forEach(function(link) {
      const href = normalizePath(link.getAttribute("href"));
      if (href === current) {
        link.classList.add("active");
      }
    });
  }

  function bindPFHints() {
    document.querySelectorAll(".pf-bar .pf").forEach(function(link) {
      const keyCell = link.querySelector(".pf-k");
      if (!keyCell) return;
      const m = /PF(\d+)/i.exec(keyCell.textContent || "");
      if (!m) return;
      const pfNum = Number(m[1]);
      link.dataset.pf = String(pfNum);
      link.title = "Tasto rapido F" + pfNum;
    });
  }

  function isExternalHref(href) {
    return /^(https?:|mailto:|tel:|javascript:|#)/i.test(href || "");
  }

  function rewriteAllLinksForMode() {
    document.querySelectorAll("a[href]").forEach(function(a) {
      const href = a.getAttribute("href");
      if (!href || isExternalHref(href)) return;

      if (href === "index.html" || href === "../index.html") {
        const home = state.mode === "clear" ? "portale-chiaro.html" : "portale-370.html";
        a.setAttribute("href", href.replace("index.html", home));
        return;
      }

      if (href.indexOf(".html") !== -1) {
        a.setAttribute("href", withMode(href, state.mode));
      }
    });
  }

  function enableClearTheme() {
    const id = "clear-archive-css";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = portalRootPrefix() + "clear-archive.css";
    document.head.appendChild(link);
  }

  function handlePFKey(e) {
    if (!/^F\d{1,2}$/i.test(e.key)) return false;
    const n = Number(e.key.slice(1));
    const target = PF_LINKS[n];
    if (!target) return false;
    e.preventDefault();
    goTo(target, "PF" + n);
    return true;
  }

  function handleNumericTerminal(e) {
    if (e.key >= "0" && e.key <= "9") {
      state.cmdBuffer += e.key;
      touchBufferTimer();
      showMsg("CMD> " + state.cmdBuffer + "_");
      return true;
    }

    if (e.key === "Backspace") {
      state.cmdBuffer = state.cmdBuffer.slice(0, -1);
      touchBufferTimer();
      showMsg("CMD> " + (state.cmdBuffer || "_"));
      return true;
    }

    if (e.key === "Escape") {
      clearBuffer();
      showMsg("CMD CANCELLATO");
      return true;
    }

    if (e.key !== "Enter") return false;
    if (!state.cmdBuffer) return false;

    const cmd = Number(state.cmdBuffer);
    const target = MENU_LINKS[cmd] || PF_LINKS[cmd];
    clearBuffer();
    if (!target) {
      showMsg("COMANDO NON VALIDO");
      return true;
    }
    goTo(target, "CMD " + cmd);
    return true;
  }

  function initKeyboardTerminal() {
    if (state.mode === "clear") return;
    document.addEventListener("keydown", function(e) {
      if (isTypingTarget(e.target)) return;
      if (handlePFKey(e)) return;
      handleNumericTerminal(e);
    });
  }

  function init() {
    state.mode = resolveMode();
    try {
      localStorage.setItem("portal_view", state.mode);
    } catch (err) {
      // Ignore localStorage errors.
    }
    document.documentElement.setAttribute("data-portal-view", state.mode);
    if (state.mode === "clear") {
      enableClearTheme();
    }

    rewriteAllLinksForMode();
    bindPFHints();
    highlightCurrentPF();
    initKeyboardTerminal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

