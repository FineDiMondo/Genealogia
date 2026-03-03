(function () {
  "use strict";

  const UI_CACHE_HINT = "gn370-static";
  const state = {
    basePath: "",
    env: {},
    swInfo: null,
    targets: null
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

  function expandTargetPath(path) {
    const raw = String(path || "");
    return raw.replace(/\{\{BASE\}\}/g, `${window.location.origin}${state.basePath}`);
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
    const pages = state.targets && Array.isArray(state.targets.pages) && state.targets.pages.length
      ? state.targets.pages
      : [
        { name: "GN370 Home", path: "{{BASE}}/index.html" },
        { name: "Control Center", path: "{{BASE}}/control/index.html" }
      ];
    let html = "<table><thead><tr><th>Name</th><th>Open</th><th>New Tab</th></tr></thead><tbody>";
    pages.forEach((p) => {
      const href = expandTargetPath(p.path);
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

  async function loadTargets() {
    try {
      const res = await fetch(abs("/control/targets.json"), { cache: "no-store" });
      if (!res.ok) {
        return null;
      }
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  async function checkUrlLight(url) {
    const details = {
      url,
      method: "HEAD",
      status: 0,
      ok: false,
      contentLength: "-",
      etag: "-",
      lastModified: "-",
      error: ""
    };
    try {
      let res = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (res.status === 405 || res.status === 501) {
        details.method = "GET(Range)";
        res = await fetch(url, {
          method: "GET",
          cache: "no-store",
          headers: { Range: "bytes=0-0" }
        });
      }
      details.status = res.status;
      details.ok = res.ok;
      details.contentLength = res.headers.get("content-length") || "-";
      details.etag = res.headers.get("etag") || "-";
      details.lastModified = res.headers.get("last-modified") || "-";
    } catch (err) {
      details.error = err.message;
    }
    return details;
  }

  async function runDatasetChecks() {
    const node = el("dataset-checks");
    if (!state.targets || !state.targets.checks) {
      node.innerHTML = "<p class='warn'>targets.json not loaded.</p>";
      return;
    }

    const checkList = []
      .concat(state.targets.checks.files || [])
      .concat(state.targets.checks.optionalDatasetZips || [])
      .concat(state.targets.checks.dataPaths || []);
    const paths = Array.from(new Set(checkList)).map(expandTargetPath);

    node.innerHTML = "<p class='muted'>Running checks...</p>";
    const results = [];
    for (const path of paths) {
      // Presence verification only: no table parsing/loading.
      const row = await checkUrlLight(path);
      results.push(row);
    }

    let html = "<table><thead><tr><th>Path</th><th>Method</th><th>Status</th><th>Length</th><th>ETag</th><th>Last-Modified</th><th>Error</th></tr></thead><tbody>";
    results.forEach((r) => {
      const cls = r.ok ? "ok" : (r.status ? "warn" : "err");
      html += `<tr class="${cls}"><td>${r.url}</td><td>${r.method}</td><td>${r.status || "-"}</td><td>${r.contentLength}</td><td>${r.etag}</td><td>${r.lastModified}</td><td>${r.error || "-"}</td></tr>`;
    });
    html += "</tbody></table>";

    if (state.targets.checks.datasetRoots && state.targets.checks.datasetRoots.length) {
      html += "<h3>Dataset Roots</h3><ul>";
      state.targets.checks.datasetRoots.forEach((root) => {
        html += `<li>${expandTargetPath(root)}</li>`;
      });
      html += "</ul>";
    }

    node.innerHTML = html;
  }

  function getHomePageUrl() {
    if (state.targets && Array.isArray(state.targets.pages)) {
      const home = state.targets.pages.find((p) => /gn370 home/i.test(p.name || ""));
      if (home && home.path) {
        return expandTargetPath(home.path);
      }
    }
    return abs("/index.html");
  }

  async function withProbeFrame(run) {
    const iframe = document.createElement("iframe");
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.opacity = "0";
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.src = getHomePageUrl();
    document.body.appendChild(iframe);

    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("iframe load timeout")), 8000);
        iframe.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        iframe.onerror = () => {
          clearTimeout(timer);
          reject(new Error("iframe load error"));
        };
      });
      return await run(iframe);
    } finally {
      iframe.remove();
    }
  }

  async function smokeTestPing() {
    return withProbeFrame(async (iframe) => {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          window.removeEventListener("message", onMessage);
          resolve({ ok: false, details: "No GN370_PONG received" });
        }, 5000);

        function onMessage(ev) {
          if (ev.origin !== window.location.origin) {
            return;
          }
          const data = ev.data || {};
          if (data.type !== "GN370_PONG") {
            return;
          }
          clearTimeout(timeout);
          window.removeEventListener("message", onMessage);
          const pass = data.dbStatus === "EMPTY" && data.hasGate === true;
          resolve({ ok: pass, details: `dbStatus=${data.dbStatus} hasGate=${data.hasGate}` });
        }

        window.addEventListener("message", onMessage);
        iframe.contentWindow.postMessage({ type: "GN370_PING" }, window.location.origin);
      });
    });
  }

  async function smokeTestGate() {
    return withProbeFrame(async (iframe) => {
      try {
        await iframe.contentWindow.fetch(expandTargetPath("{{BASE}}/tables/PERSON.table?control_probe=1"), { cache: "no-store" });
        return { ok: false, details: "Fetch not blocked by gate" };
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        const pass = msg.indexOf("GATE_VIOLATION") >= 0;
        return { ok: pass, details: msg };
      }
    });
  }

  async function smokeTestSwDataPolicy() {
    if (!("caches" in window)) {
      return { ok: false, details: "Cache API unavailable" };
    }
    const probePath = state.targets && state.targets.checks && state.targets.checks.dataPaths && state.targets.checks.dataPaths[0]
      ? expandTargetPath(state.targets.checks.dataPaths[0])
      : abs("/tables/PERSON.table");
    const directMatch = await caches.match(probePath);
    const keys = await caches.keys();
    let cachedData = false;
    for (const key of keys) {
      const cache = await caches.open(key);
      const reqs = await cache.keys();
      if (reqs.some((r) => /(\/tables\/|\.table(\?|$)|\/data\/current\/)/i.test(r.url))) {
        cachedData = true;
        break;
      }
    }
    const pass = !directMatch && !cachedData;
    return { ok: pass, details: `directMatch=${!!directMatch} cachedDataEntries=${cachedData}` };
  }

  async function smokeTestControlCached() {
    const sw = await getSWInfo();
    if (!sw.supported || !sw.controller) {
      return { ok: false, skip: true, details: "No active service worker controller" };
    }
    const candidates = [window.location.href, abs("/control/index.html")];
    for (const candidate of candidates) {
      const m = await caches.match(candidate);
      if (m) {
        return { ok: true, details: `Found in cache: ${candidate}` };
      }
    }
    return { ok: false, details: "control/index.html not found in cache" };
  }

  async function runSmokeTests() {
    const tests = [
      { id: "SMK-001", name: "Boot invariant handshake", fn: smokeTestPing },
      { id: "SMK-002", name: "Gate blocks fetch before READY", fn: smokeTestGate },
      { id: "SMK-003", name: "SW data policy (no data cache)", fn: smokeTestSwDataPolicy },
      { id: "SMK-004", name: "Control page cached when SW active", fn: smokeTestControlCached }
    ];
    const node = el("smoke-tests");
    node.innerHTML = "<p class='muted'>Running smoke tests...</p>";
    const rows = [];
    for (const t of tests) {
      try {
        const out = await t.fn();
        rows.push({ id: t.id, name: t.name, ...out });
      } catch (err) {
        rows.push({ id: t.id, name: t.name, ok: false, details: err.message || String(err) });
      }
    }
    let html = "<table><thead><tr><th>ID</th><th>Test</th><th>Result</th><th>Details</th></tr></thead><tbody>";
    rows.forEach((r) => {
      const result = r.skip ? "SKIP" : (r.ok ? "PASS" : "FAIL");
      const cls = r.skip ? "warn" : (r.ok ? "ok" : "err");
      html += `<tr class="${cls}"><td>${r.id}</td><td>${r.name}</td><td>${result}</td><td>${r.details || "-"}</td></tr>`;
    });
    html += "</tbody></table>";
    node.innerHTML = html;
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
      case "run-dataset-checks":
        await runDatasetChecks();
        log("Dataset presence checks completed.", "ok");
        return;
      case "run-smoke-tests":
        await runSmokeTests();
        log("Smoke tests completed.", "ok");
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
    state.targets = await loadTargets();
    renderEnv();
    renderHub();
    bindActions();
    await resourceStatus();
    await runDatasetChecks();
  }

  document.addEventListener("DOMContentLoaded", init);
}());
