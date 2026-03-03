(function () {
  "use strict";

  const UI_CACHE_HINT = "gn370-static";
  const state = {
    basePath: "",
    env: {},
    swInfo: null
  };

  function el(id) {
    return document.getElementById(id);
  }

  function detectBasePath() {
    const p = window.location.pathname;
    const ix = p.indexOf("/control/");
    if (ix >= 0) {
      return p.slice(0, ix) || "";
    }
    if (/\/control\/?$/.test(p)) {
      return p.replace(/\/control\/?$/, "");
    }
    return "";
  }

  function abs(path) {
    const clean = String(path || "").replace(/^\/+/, "");
    return `${window.location.origin}${state.basePath}/${clean}`.replace(/([^:]\/)\/+/g, "$1");
  }

  function log(msg, cls) {
    const node = el("quick-log");
    const line = document.createElement("div");
    if (cls) {
      line.className = cls;
    }
    line.textContent = `[${new Date().toISOString()}] ${msg}`;
    node.prepend(line);
  }

  function requireConfirm() {
    const ok = el("confirm-destructive").checked;
    if (!ok) {
      log("Confirm destructive actions first.", "warn");
      return false;
    }
    return true;
  }

  async function getSWInfo() {
    if (!("serviceWorker" in navigator)) {
      return { supported: false };
    }
    const regs = await navigator.serviceWorker.getRegistrations();
    return {
      supported: true,
      controller: navigator.serviceWorker.controller ? {
        scriptURL: navigator.serviceWorker.controller.scriptURL
      } : null,
      registrations: regs.map((r) => ({
        scope: r.scope,
        active: r.active ? r.active.scriptURL : null
      }))
    };
  }

  async function listCaches() {
    if (!("caches" in window)) {
      return [];
    }
    const keys = await caches.keys();
    const out = [];
    for (const key of keys) {
      const c = await caches.open(key);
      const reqs = await c.keys();
      let approxBytes = 0;
      for (const req of reqs) {
        const res = await c.match(req);
        const len = res && res.headers ? Number(res.headers.get("content-length") || 0) : 0;
        approxBytes += Number.isFinite(len) ? len : 0;
      }
      out.push({ key, entries: reqs.length, approxBytes });
    }
    return out;
  }

  async function clearCaches(mode) {
    if (!("caches" in window)) {
      return;
    }
    const keys = await caches.keys();
    for (const key of keys) {
      if (mode === "ui-only") {
        if (key.indexOf(UI_CACHE_HINT) >= 0) {
          await caches.delete(key);
        }
      } else {
        await caches.delete(key);
      }
    }
  }

  function clearStorage() {
    localStorage.clear();
    sessionStorage.clear();
  }

  async function deleteIndexedDB() {
    if (!indexedDB || !indexedDB.databases) {
      return { supported: false };
    }
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db && db.name) {
        await new Promise((resolve) => {
          const req = indexedDB.deleteDatabase(db.name);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
          req.onblocked = () => resolve();
        });
      }
    }
    return { supported: true, deleted: dbs.map((d) => d.name).filter(Boolean) };
  }

  async function unregisterSW() {
    if (!("serviceWorker" in navigator)) {
      return [];
    }
    const regs = await navigator.serviceWorker.getRegistrations();
    const out = [];
    for (const r of regs) {
      const ok = await r.unregister();
      out.push({ scope: r.scope, ok });
    }
    return out;
  }

  function hardReload() {
    window.location.reload();
  }

  async function resourceStatus() {
    const cacheRows = await listCaches();
    const storageEstimate = (navigator.storage && navigator.storage.estimate)
      ? await navigator.storage.estimate()
      : null;
    const lsKeys = Object.keys(localStorage);
    const ssKeys = Object.keys(sessionStorage);

    let html = "<h3>Caches</h3>";
    if (!cacheRows.length) {
      html += "<p class='muted'>No caches</p>";
    } else {
      html += "<table><thead><tr><th>Cache Key</th><th>Entries</th><th>Approx Bytes</th></tr></thead><tbody>";
      cacheRows.forEach((row) => {
        html += `<tr><td>${row.key}</td><td>${row.entries}</td><td>${row.approxBytes}</td></tr>`;
      });
      html += "</tbody></table>";
    }

    html += "<h3>Storage</h3>";
    html += `<p>localStorage keys: ${lsKeys.length}</p><pre class='output mono'>${lsKeys.join("\n") || "-"}</pre>`;
    html += `<p>sessionStorage keys: ${ssKeys.length}</p><pre class='output mono'>${ssKeys.join("\n") || "-"}</pre>`;
    if (storageEstimate) {
      html += `<p>Storage estimate: usage=${storageEstimate.usage || 0} quota=${storageEstimate.quota || 0}</p>`;
    }

    el("resource-status").innerHTML = html;
  }

  function renderHub() {
    const pages = [
      { name: "GN370 Home", path: "/index.html" },
      { name: "Control Center", path: "/control/index.html" }
    ];
    let html = "<table><thead><tr><th>Name</th><th>Open</th><th>New Tab</th></tr></thead><tbody>";
    pages.forEach((p) => {
      const href = abs(p.path);
      html += `<tr><td>${p.name}</td><td><a href="${href}">Open</a></td><td><a href="${href}" target="_blank" rel="noopener">Open new tab</a></td></tr>`;
    });
    html += "</tbody></table>";
    el("pages-hub").innerHTML = html;
  }

  function renderEnv() {
    const lines = [];
    lines.push(`href: ${window.location.href}`);
    lines.push(`basePath: ${state.basePath || "/"}`);
    lines.push(`origin: ${window.location.origin}`);
    lines.push(`sw supported: ${state.swInfo && state.swInfo.supported ? "yes" : "no"}`);
    if (state.swInfo && state.swInfo.controller) {
      lines.push(`sw controller: ${state.swInfo.controller.scriptURL}`);
    }
    if (state.env.version) {
      lines.push(`version: ${state.env.version.version} env=${state.env.version.env} schema=${state.env.version.schema_version}`);
    } else {
      lines.push("version: unavailable");
    }
    el("env-info").textContent = lines.join("\n");
  }

  async function fetchVersion() {
    try {
      const res = await fetch(abs("/version.json"), { cache: "no-store" });
      if (!res.ok) {
        return null;
      }
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  async function handleAction(action) {
    if (action === "refresh-status") {
      await resourceStatus();
      log("Resource status refreshed.", "ok");
      return;
    }

    if (["clear-ui-cache", "clear-all-caches", "clear-storage", "delete-idb", "unregister-sw", "full-reset"].includes(action)) {
      if (!requireConfirm()) {
        return;
      }
    }

    switch (action) {
      case "clear-ui-cache":
        await clearCaches("ui-only");
        log("UI cache cleared.", "ok");
        break;
      case "clear-all-caches":
        await clearCaches("all");
        log("All caches cleared.", "ok");
        break;
      case "clear-storage":
        clearStorage();
        log("localStorage and sessionStorage cleared.", "ok");
        break;
      case "delete-idb": {
        const result = await deleteIndexedDB();
        if (result.supported) {
          log(`IndexedDB delete completed (${result.deleted.length}).`, "ok");
        } else {
          log("IndexedDB listing not supported by this browser.", "warn");
        }
        break;
      }
      case "unregister-sw": {
        const out = await unregisterSW();
        log(`SW unregister done (${out.length} registration(s)).`, "ok");
        break;
      }
      case "hard-reload":
        hardReload();
        return;
      case "full-reset":
        await clearCaches("all");
        clearStorage();
        await deleteIndexedDB();
        await unregisterSW();
        log("Full reset completed. Reloading...", "ok");
        setTimeout(hardReload, 500);
        return;
      default:
        log(`Unknown action: ${action}`, "warn");
    }

    await resourceStatus();
  }

  function bindActions() {
    document.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const action = btn.getAttribute("data-action");
        try {
          await handleAction(action);
        } catch (err) {
          log(`Action failed: ${action} -> ${err.message}`, "err");
        }
      });
    });
  }

  async function init() {
    state.basePath = detectBasePath();
    state.swInfo = await getSWInfo();
    state.env.version = await fetchVersion();
    renderEnv();
    renderHub();
    bindActions();
    await resourceStatus();
  }

  document.addEventListener("DOMContentLoaded", init);
}());
