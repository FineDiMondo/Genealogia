(function () {
  const commandInput = document.getElementById("ispf-command-input");
  const messageLine = document.getElementById("ispf-message-line");
  const panel = window.__ISPF_PANEL__ || { path: window.location.pathname };

  const BASE_URL = window.location.pathname.startsWith("/Genealogia/") ? "/Genealogia/" : "/";

  const sectionOrder = [
    "",
    "gestionale/search?domain=people",
    "gestionale/search?domain=families",
    "gestionale/reports?domain=events",
    "gestionale/reports?domain=sources",
    "gestionale/reports?domain=arms",
    "gestionale/reports?domain=titles",
    "gestionale/batch-monitor",
    "gestionale/help"
  ];

  const goMap = {
    HOME: "",
    PERSONE: "gestionale/search?domain=people",
    FAMIGLIE: "gestionale/search?domain=families",
    EVENTI: "gestionale/reports?domain=events",
    FONTI: "gestionale/reports?domain=sources",
    ARALDICA: "gestionale/reports?domain=arms",
    NOBILTA: "gestionale/reports?domain=titles",
    JOBS: "gestionale/batch-monitor",
    HELP: "gestionale/help"
  };

  function showMessage(text, warning) {
    if (!messageLine) return;
    messageLine.textContent = text;
    messageLine.style.color = warning ? "#ffcc66" : "#b9f6b9";
  }

  function toBase(path) {
    if (!path) return BASE_URL;
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith(BASE_URL)) return path;
    if (path.startsWith("/")) return BASE_URL + path.replace(/^\/+/, "");
    return BASE_URL + path.replace(/^\/+/, "");
  }

  function normalizePath() {
    return window.location.pathname + window.location.search;
  }

  function codeFromAnchor(anchor) {
    return (
      anchor?.dataset?.code ||
      anchor?.querySelector(".mr")?.textContent?.trim() ||
      "GN000"
    );
  }

  function resolveLink(rawHref, opts) {
    const options = opts || {};
    const href = (rawHref || "").trim();

    if (options.forceUnavailable) {
      return { available: false, code: options.code || "GN000" };
    }

    if (!href || href.startsWith("#")) {
      return { available: true, path: href };
    }

    if (/^https?:\/\//i.test(href)) {
      try {
        const u = new URL(href);
        if (u.origin !== window.location.origin) {
          return { available: false, code: "GNEXT" };
        }
        return resolveLink(u.pathname + u.search + u.hash);
      } catch {
        return { available: false, code: "GNURL" };
      }
    }

    if (href === "/") return { available: true, path: BASE_URL };
    if (href === "/search" || href === "/search/") return { available: true, path: toBase("search") };
    if (href.startsWith("/gestionale/")) return { available: true, path: toBase(href) };
    if (href.startsWith("/data/current/")) return { available: true, path: toBase(href) };

    if (href.startsWith("/PORTALE_GN/")) {
      return { available: false, code: "GN800" };
    }

    if (href.startsWith("/")) {
      return { available: false, code: "GN404" };
    }

    return { available: true, path: toBase(href) };
  }

  function routeTo(path, code) {
    const resolved = resolveLink(path, { code: code });
    if (!resolved.available) {
      showMessage(`FUNZIONE NON DISPONIBILE - [${resolved.code}]`, true);
      return;
    }
    if (!resolved.path || resolved.path === "#") return;
    window.location.href = resolved.path;
  }

  function clearFindHighlights() {
    document.querySelectorAll(".find-hit").forEach((el) => {
      el.classList.remove("find-hit");
      el.style.outline = "";
      el.style.outlineOffset = "";
    });
  }

  function runInlineFind(term) {
    const needle = (term || "").trim().toUpperCase();
    clearFindHighlights();
    if (!needle) {
      showMessage("FIND VALUE MISSING", true);
      return;
    }

    const items = Array.from(document.querySelectorAll("a.menu-item, .ispf-menu a"));
    const matches = items.filter((item) => (item.textContent || "").toUpperCase().includes(needle));

    matches.forEach((item) => {
      item.classList.add("find-hit");
      item.style.outline = "1px dashed #ffcc66";
      item.style.outlineOffset = "2px";
    });

    if (matches.length > 0) {
      matches[0].scrollIntoView({ block: "center", behavior: "smooth" });
    }

    showMessage(`RICERCA: [${term}] - ${matches.length} RISULTATI TROVATI`, matches.length === 0);
  }

  function toggleSort() {
    const url = new URL(window.location.href);
    const current = url.searchParams.get("sort");
    const next = current === "asc" ? "desc" : "asc";
    url.searchParams.set("sort", next);
    routeTo(url.pathname + url.search);
  }

  function goRelative(delta) {
    const current = normalizePath();
    const idx = sectionOrder.findIndex((x) => {
      const full = toBase(x);
      return x && (current === full || current.startsWith(full.split("?")[0]));
    });
    const pos = idx >= 0 ? idx : 0;
    const next = (pos + delta + sectionOrder.length) % sectionOrder.length;
    routeTo(sectionOrder[next]);
  }

  function runCommand(raw) {
    const value = (raw || "").trim();
    if (!value) {
      showMessage("READY");
      return;
    }

    const cmd = value.toUpperCase();

    if (cmd === "HOME" || cmd === "RETURN") return routeTo("");
    if (cmd === "HELP") return routeTo("gestionale/help");
    if (cmd === "END") return window.history.back();
    if (cmd === "REFRESH") return window.location.reload();
    if (cmd === "SORT") return toggleSort();

    if (cmd.startsWith("GO ")) {
      const target = cmd.replace("GO ", "").trim();
      if (goMap[target]) return routeTo(goMap[target]);
      return showMessage("UNKNOWN GO TARGET", true);
    }

    if (cmd.startsWith("FIND ")) {
      const term = value.slice(5).trim();
      if (!term) return showMessage("FIND VALUE MISSING", true);
      if (document.querySelector(".menu-item") || document.querySelector(".ispf-menu a")) {
        return runInlineFind(term);
      }
      return routeTo(`search?q=${encodeURIComponent(term)}`);
    }

    showMessage("UNKNOWN COMMAND", true);
  }

  function bindCommandLine() {
    if (!commandInput) return;

    commandInput.addEventListener("focus", () => {
      commandInput.select();
    });

    commandInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        const raw = commandInput.value;
        runCommand(raw);
        commandInput.value = "";
      }
    });
  }

  function bindLinkGuards() {
    document.addEventListener("click", (ev) => {
      const anchor = ev.target.closest("a[href]");
      if (!anchor) return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
        return;
      }

      const forceUnavailable = anchor.dataset.unavailable === "true";
      const resolved = resolveLink(href, { forceUnavailable: forceUnavailable, code: codeFromAnchor(anchor) });

      if (!resolved.available) {
        ev.preventDefault();
        showMessage(`FUNZIONE NON DISPONIBILE - [${resolved.code}]`, true);
        return;
      }

      if (resolved.path && resolved.path !== href) {
        ev.preventDefault();
        routeTo(resolved.path);
      }
    });
  }

  function bindFunctionKeys() {
    document.addEventListener("keydown", (ev) => {
      if (!/^F\d+$/.test(ev.key)) return;
      ev.preventDefault();

      switch (ev.key) {
        case "F1":
          return routeTo(`gestionale/help?panel=${encodeURIComponent(panel.path || BASE_URL)}`);
        case "F2":
          return window.open(window.location.href, "_blank");
        case "F3":
          return window.history.back();
        case "F4":
          return routeTo("");
        case "F5":
          return window.location.reload();
        case "F6":
          return toggleSort();
        case "F7":
          return window.scrollBy({ top: -240, behavior: "smooth" });
        case "F8":
          return window.scrollBy({ top: 240, behavior: "smooth" });
        case "F9":
          if (document.activeElement === commandInput) {
            return document.body.focus();
          }
          if (commandInput) commandInput.focus();
          return;
        case "F10":
          return goRelative(-1);
        case "F11":
          return goRelative(1);
        case "F12":
          if (commandInput) commandInput.value = "";
          clearFindHighlights();
          showMessage("COMMAND CLEARED");
          return;
        default:
          return;
      }
    });
  }

  bindCommandLine();
  bindLinkGuards();
  bindFunctionKeys();
})();
