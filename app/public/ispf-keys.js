(function () {
  const commandInput = document.getElementById("ispf-command-input");
  const messageLine = document.getElementById("ispf-message-line");
  const panel = window.__ISPF_PANEL__ || { path: window.location.pathname };
  const sectionOrder = [
    "/",
    "/gestionale/search?domain=people",
    "/gestionale/search?domain=families",
    "/gestionale/reports?domain=events",
    "/gestionale/reports?domain=sources",
    "/gestionale/reports?domain=arms",
    "/gestionale/reports?domain=titles",
    "/gestionale/batch-monitor",
    "/gestionale/help"
  ];
  const goMap = {
    HOME: "/",
    PERSONE: "/gestionale/search?domain=people",
    FAMIGLIE: "/gestionale/search?domain=families",
    EVENTI: "/gestionale/reports?domain=events",
    FONTI: "/gestionale/reports?domain=sources",
    ARALDICA: "/gestionale/reports?domain=arms",
    NOBILTA: "/gestionale/reports?domain=titles",
    JOBS: "/gestionale/batch-monitor",
    HELP: "/gestionale/help"
  };

  function showMessage(text, warning) {
    if (!messageLine) return;
    messageLine.textContent = text;
    messageLine.style.color = warning ? "#ffcc66" : "#b9f6b9";
  }

  function normalizePath() {
    return window.location.pathname + window.location.search;
  }

  function routeTo(path) {
    window.location.href = path;
  }

  function runCommand(raw) {
    const value = (raw || "").trim();
    if (!value) {
      showMessage("READY");
      return;
    }
    const cmd = value.toUpperCase();

    if (cmd === "HOME" || cmd === "RETURN") return routeTo("/");
    if (cmd === "HELP") return routeTo("/gestionale/help");
    if (cmd === "END") return window.history.back();
    if (cmd === "REFRESH") return window.location.reload();
    if (cmd === "SORT") return toggleSort();
    if (cmd.startsWith("GO ")) {
      const target = cmd.replace("GO ", "").trim();
      if (goMap[target]) return routeTo(goMap[target]);
      return showMessage("UNKNOWN GO TARGET", true);
    }
    if (cmd.startsWith("FIND ")) {
      const q = encodeURIComponent(value.slice(5).trim());
      if (!q) return showMessage("FIND VALUE MISSING", true);
      return routeTo(`/gestionale/search?q=${q}`);
    }
    showMessage("UNKNOWN COMMAND", true);
  }

  function toggleSort() {
    const url = new URL(window.location.href);
    const current = url.searchParams.get("sort");
    const next = current === "asc" ? "desc" : "asc";
    url.searchParams.set("sort", next);
    routeTo(url.toString());
  }

  function goRelative(delta) {
    const current = normalizePath();
    const idx = sectionOrder.findIndex((x) => x === current || current.startsWith(x.split("?")[0]));
    const pos = idx >= 0 ? idx : 0;
    const next = (pos + delta + sectionOrder.length) % sectionOrder.length;
    routeTo(sectionOrder[next]);
  }

  function bindCommandLine() {
    if (!commandInput) return;
    commandInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        runCommand(commandInput.value);
      }
    });
  }

  function bindFunctionKeys() {
    document.addEventListener("keydown", (ev) => {
      if (!/^F\d+$/.test(ev.key)) return;
      ev.preventDefault();

      switch (ev.key) {
        case "F1":
          return routeTo(`/gestionale/help?panel=${encodeURIComponent(panel.path || "/")}`);
        case "F2":
          return window.open(window.location.href, "_blank");
        case "F3":
          return window.history.back();
        case "F4":
          return routeTo("/");
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
          showMessage("COMMAND CLEARED");
          return;
        default:
          return;
      }
    });
  }

  bindCommandLine();
  bindFunctionKeys();
})();
