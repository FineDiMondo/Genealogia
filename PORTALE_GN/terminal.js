(function() {
  "use strict";

  const PF_LINKS = {
    1: "index.html",
    3: "famiglie.html",
    4: "giardina.html",
    5: "negrini.html",
    6: "nobili.html",
    7: "analisi.html",
    8: "fonti.html",
    9: "media.html"
  };

  const MENU_LINKS = {
    1: "famiglie.html",
    2: "giardina.html",
    3: "negrini.html",
    4: "nobili.html",
    5: "analisi.html",
    6: "fonti.html",
    7: "media.html",
    8: "spazio_agentico.html",
    9: "generated/index.html"
  };

  const state = {
    cmdBuffer: "",
    bufferTimer: null
  };

  function portalRootPrefix() {
    const p = (window.location.pathname || "").replace(/\\/g, "/");
    const marker = "/generated/";
    const idx = p.indexOf(marker);
    if (idx === -1) return "";
    const tail = p.slice(idx + marker.length);
    const parts = tail.split("/").filter(Boolean);
    const depth = parts.length > 0 ? parts.length : 1;
    return "../".repeat(depth);
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
    const resolved = resolvePortalPath(path);
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
    document.addEventListener("keydown", function(e) {
      if (isTypingTarget(e.target)) return;
      if (handlePFKey(e)) return;
      handleNumericTerminal(e);
    });
  }

  function init() {
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
