const assert = require("assert");
const net = require("net");
const { spawn } = require("child_process");
function resolveChromium() {
  try {
    return require("playwright").chromium;
  } catch (_) {
    try {
      return require("@playwright/test").chromium;
    } catch (_) {
      return null;
    }
  }
}

const BASE_URL = process.env.GN370_TEST_URL || "http://localhost:8080";
const DEFAULT_PORT = Number(new URL(BASE_URL).port || 8080);

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(400);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, "127.0.0.1");
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPort(port, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen(port)) {
      return true;
    }
    await wait(150);
  }
  return false;
}

function startLocalServer() {
  const pyCmd = process.platform === "win32" ? "python" : "python3";
  const args = ["-m", "http.server", String(DEFAULT_PORT)];
  return spawn(pyCmd, args, {
    cwd: process.cwd(),
    stdio: "ignore",
    windowsHide: true
  });
}

async function runParityScenario(page) {
  return page.evaluate(async () => {
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function waitFor(predicate, timeoutMs, stepMs) {
      const start = Date.now();
      while (Date.now() - start <= timeoutMs) {
        if (predicate()) {
          return true;
        }
        await sleep(stepMs);
      }
      return false;
    }

    const tables = {
      PERSON: [
        {
          person_id: "GNP000000001",
          gedcom_id: "@I1@",
          surname: "GIARDINA",
          given_name: "CALOGERO",
          gender: "M",
          birth_date: "1850",
          birth_qual: "E",
          birth_cal: "G",
          birth_place: "PALERMO",
          death_date: "",
          death_qual: "",
          death_cal: "G",
          death_place: "",
          notes: ""
        }
      ],
      FAMILY: [
        {
          family_id: "GNF000000001",
          father_id: "GNP000000001",
          mother_id: "",
          union_date: "1870",
          union_date_qual: "E",
          notes: ""
        }
      ],
      PLACE: [{ place_id: "GPL000001", place_name: "PALERMO", parent_id: "", notes: "" }],
      SOURCE: [{ source_id: "GNS000000001", title: "REGISTRO", author: "", source_type: "ARCHIVE", notes: "" }],
      EVENT: [{ event_id: "GNE000000001", person_id: "GNP000000001", family_id: "", event_type: "BIRT", event_date: "1850", event_date_qual: "E", place_id: "GPL000001", source_id: "GNS000000001", note: "" }],
      CITATION: [{ citation_id: "GNC000000001", source_id: "GNS000000001", person_id: "GNP000000001", family_id: "", event_id: "GNE000000001", page: "p.1", note: "" }],
      IMPORT_LOG_FAMILY: [
        {
          family_key: "FAM:F1",
          log_ts: "20260304010000",
          import_session: "PARITY001",
          pipeline_id: "PARITY001-00001",
          record_type: "INDI",
          gedcom_xref: "@I1@",
          final_db_id: "GNP000000001",
          decision: "ACCEPT_NEW",
          ai_applied: "N",
          ai_conf: 0,
          ai_reason: "",
          norm_payload_json: "{\"surname_norm\":\"GIARDINA\"}"
        }
      ]
    };

    const before = GN370.SQL_RUNTIME.status();
    const beforeSyncCount = Number(before.sync_count || 0);
    GN370.DB_ENGINE.populate(tables, {
      source: "PARITY_TEST",
      imported_at: new Date().toISOString(),
      import_session: "PARITY001"
    });

    const synced = await waitFor(function () {
      return Number(GN370.SQL_RUNTIME.status().sync_count || 0) > beforeSyncCount;
    }, 8000, 100);

    const mem = GN370.DB_ENGINE.dump();
    const sql = GN370.SQL_RUNTIME.dump();
    const sqlStatus = GN370.SQL_RUNTIME.status();
    const memCounts = {};
    Object.keys(mem.tables || {}).forEach(function (name) {
      memCounts[name] = (mem.tables[name] || []).length;
    });

    const tableMetaMap = {};
    (sql.table_meta || []).forEach(function (row) {
      tableMetaMap[row.table_name] = Number(row.row_count || 0);
    });

    const typedMetaMap = {};
    (sql.typed_meta || []).forEach(function (row) {
      typedMetaMap[row.source_table] = Number(row.row_count || 0);
    });

    const recordsTotal = Object.keys(memCounts).reduce(function (acc, key) {
      return acc + Number(memCounts[key] || 0);
    }, 0);
    const parity = Object.keys(memCounts).every(function (t) {
      return tableMetaMap[t] === memCounts[t];
    });

    const expectedTyped = ["PERSON", "FAMILY", "PLACE", "SOURCE", "EVENT", "CITATION", "IMPORT_LOG_FAMILY"];
    const typedParity = expectedTyped.every(function (t) {
      return typedMetaMap[t] === (memCounts[t] || 0);
    });

    const hasImportAudit = (sql.import_audit || []).some(function (a) {
      return a.import_id === "PARITY001" && Number(a.records_total) === recordsTotal;
    });

    GN370.DB_ENGINE.reset();
    const resetOk = await waitFor(function () {
      var s = GN370.SQL_RUNTIME.dump();
      return Array.isArray(s.table_meta) && s.table_meta.length === 0;
    }, 8000, 100);

    return {
      synced: synced,
      dbStatus: GN370.STATE.getStatus(),
      memStatus: GN370.DB_ENGINE.memoryStatus(),
      sqlStatus: sqlStatus,
      parity: parity,
      typedParity: typedParity,
      hasImportAudit: hasImportAudit,
      resetOk: resetOk,
      recordsTotal: recordsTotal,
      tablesCount: Object.keys(memCounts).length
    };
  });
}

async function main() {
  let serverProcess = null;
  let browser = null;
  const chromium = resolveChromium();
  try {
    if (!chromium) {
      console.log("[SKIP] sql runtime parity: playwright not installed");
      return;
    }

    if (!(await isPortOpen(DEFAULT_PORT))) {
      serverProcess = startLocalServer();
      const started = await waitForPort(DEFAULT_PORT, 5000);
      if (!started) {
        throw new Error("HTTP_SERVER_START_FAILED");
      }
    }

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    const out = await runParityScenario(page);

    assert.strictEqual(out.synced, true, "SQL sync was not observed");
    assert.strictEqual(out.parity, true, "table_meta row_count mismatch vs memory tables");
    assert.strictEqual(out.typedParity, true, "typed_meta row_count mismatch vs memory tables");
    assert.strictEqual(out.hasImportAudit, true, "import audit missing PARITY001 or wrong records_total");
    assert.strictEqual(out.resetOk, true, "SQL runtime reset did not clear table_meta");
    assert.strictEqual(out.dbStatus, "EMPTY", "DB status should be EMPTY after reset");
    assert.strictEqual(out.memStatus.status, "CLEAN", "Memory status should be CLEAN after reset");

    console.log("[OK] sql runtime parity checks passed");
    console.log("[INFO] parity tables=" + out.tablesCount + " records=" + out.recordsTotal);
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (/browser.*not found/i.test(msg) || /playwright install/i.test(msg)) {
      console.log("[SKIP] sql runtime parity: browser binary not available");
      return;
    }
    console.error("[FAIL] sql runtime parity:", msg);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
    }
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill();
    }
  }
}

main();
