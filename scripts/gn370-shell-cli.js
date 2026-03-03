#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const net = require("net");
const readline = require("readline");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const BASE_URL = process.env.GN370_TEST_URL || "http://localhost:8080";
const DEFAULT_PORT = Number(new URL(BASE_URL).port || 8080);

let browser = null;
let page = null;
let serverProcess = null;
let shuttingDown = false;

function tokenize(input) {
  const raw = String(input || "").trim();
  if (!raw) {
    return [];
  }
  const out = [];
  const re = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|\S+/g;
  const parts = raw.match(re) || [];
  parts.forEach((tok) => {
    if ((tok.startsWith("\"") && tok.endsWith("\"")) || (tok.startsWith("'") && tok.endsWith("'"))) {
      out.push(tok.slice(1, -1));
    } else {
      out.push(tok);
    }
  });
  return out;
}

function hasFlag(tokens, flag) {
  return tokens.includes(flag);
}

function getFlagValue(tokens, flag) {
  const i = tokens.indexOf(flag);
  if (i >= 0 && tokens[i + 1]) {
    return tokens[i + 1];
  }
  return "";
}

function asAbsolutePath(p) {
  if (!p) {
    return "";
  }
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error("FILE_NOT_FOUND: " + filePath);
  }
  const st = fs.statSync(filePath);
  if (!st.isFile()) {
    throw new Error("NOT_A_FILE: " + filePath);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    cwd: ROOT,
    stdio: "ignore",
    windowsHide: true
  });
}

async function ensureServer() {
  if (await isPortOpen(DEFAULT_PORT)) {
    return;
  }
  serverProcess = startLocalServer();
  const ok = await waitForPort(DEFAULT_PORT, 5000);
  if (!ok) {
    throw new Error("HTTP_SERVER_START_FAILED on port " + DEFAULT_PORT);
  }
}

async function initRuntime() {
  await ensureServer();
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
}

async function execRouter(raw) {
  return page.evaluate(async (cmd) => {
    const out = document.getElementById("gn370-output");
    const before = out ? out.textContent : "";
    await GN370.ROUTER.dispatch(cmd);
    const after = out ? out.textContent : "";
    const delta = after.startsWith(before) ? after.slice(before.length) : after;
    return {
      delta: delta || "",
      dbStatus: window.__GN370_DB_STATUS || "UNKNOWN"
    };
  }, raw);
}

function renderJson(obj) {
  return JSON.stringify(obj, null, 2);
}

async function cmdGedcom(tokens) {
  const fileArg = getFlagValue(tokens, "--file");
  if (!fileArg) {
    return "Uso: import gedcom --file <path.ged> [--dry-run] [--auto-skip-low] [--strict]";
  }
  const filePath = asAbsolutePath(fileArg);
  ensureFileExists(filePath);
  const text = fs.readFileSync(filePath, "utf8");
  const opts = {
    dryRun: hasFlag(tokens, "--dry-run"),
    autoSkipLow: hasFlag(tokens, "--auto-skip-low"),
    strict: hasFlag(tokens, "--strict")
  };
  const out = await page.evaluate((payload) => {
    const session = GN370.GEDCOM.startFromText(payload.text, payload.opts);
    return {
      source: payload.source,
      session_id: session.session_id,
      stage_stats: session.stage_stats,
      writer_stats: session.writer_stats
    };
  }, { text, opts, source: filePath });
  return renderJson(out);
}

async function cmdDbImport(tokens) {
  const fileArg = getFlagValue(tokens, "--file");
  if (!fileArg) {
    return "Uso: db import --file <path.zip>";
  }
  const filePath = asAbsolutePath(fileArg);
  ensureFileExists(filePath);
  const bytes = fs.readFileSync(filePath);
  const out = await page.evaluate(async (payload) => {
    const arr = new Uint8Array(payload.bytes);
    const file = new File([arr], payload.name, { type: "application/zip" });
    const result = await GN370.DB_ENGINE.importZip(file);
    return {
      source: payload.source,
      result
    };
  }, { bytes: Array.from(bytes), name: path.basename(filePath), source: filePath });
  return renderJson(out);
}

function resolveExportPath(outArg, fileName) {
  if (!outArg) {
    const dir = path.join(ROOT, "uploads", "exports");
    return path.join(dir, fileName);
  }
  const abs = asAbsolutePath(outArg);
  if (/\.zip$/i.test(abs)) {
    return abs;
  }
  return path.join(abs, fileName);
}

async function cmdDbExport(tokens) {
  const outArg = getFlagValue(tokens, "--out");
  const payload = await page.evaluate(async () => {
    GN370.DB_ENGINE.gate();
    const dump = GN370.DB_ENGINE.dump();
    const tables = dump.tables || {};
    const tableNames = Object.keys(tables).sort();
    const zip = new JSZip();
    for (let i = 0; i < tableNames.length; i += 1) {
      const t = tableNames[i];
      const content = await GN370.DB_ENGINE.serializeTable(t, tables[t]);
      zip.file("tables/" + t + ".table", content);
    }
    const fileName = GN370.DB_ENGINE.nowAAAAGGMMHHMM() + ".zip";
    const base64 = await zip.generateAsync({ type: "base64" });
    const counts = {};
    tableNames.forEach((t) => {
      counts[t] = Array.isArray(tables[t]) ? tables[t].length : 0;
    });
    return { fileName, base64, tableNames, counts };
  });

  const outPath = resolveExportPath(outArg, payload.fileName);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(payload.base64, "base64"));
  return renderJson({
    exported_zip: outPath,
    tables: payload.tableNames,
    counts: payload.counts
  });
}

async function cmdFileAgent(tokens, moduleKey, usage) {
  const fileArg = getFlagValue(tokens, "--file");
  if (!fileArg) {
    return usage;
  }
  const filePath = asAbsolutePath(fileArg);
  ensureFileExists(filePath);
  const bytes = fs.readFileSync(filePath);
  const out = await page.evaluate(async (payload) => {
    const mod = GN370.IMPORT[payload.moduleKey];
    if (!mod || typeof mod.importFile !== "function") {
      throw new Error("IMPORT_MODULE_NOT_AVAILABLE: " + payload.moduleKey);
    }
    const file = new File([new Uint8Array(payload.bytes)], payload.name, { type: payload.mime });
    await mod.importFile(file);
    return {
      source: payload.source,
      module: payload.moduleKey,
      status: GN370.STATE.getStatus()
    };
  }, {
    moduleKey,
    bytes: Array.from(bytes),
    name: path.basename(filePath),
    source: filePath,
    mime: moduleKey === "herald" ? "text/csv" : (moduleKey === "notarial" ? "text/xml" : "application/json")
  });
  return renderJson(out);
}

function cliHelp() {
  return [
    "GN370 Bash Shell (headless runtime)",
    "",
    "Comandi wrapper file-based:",
    "  import gedcom --file <path.ged> [--dry-run] [--auto-skip-low] [--strict]",
    "  db import --file <path.zip>",
    "  db export [--out <dir|file.zip>]",
    "  import herald --file <path.csv>",
    "  import notarial --file <path.xml>",
    "  import nobility --file <path.json>",
    "",
    "Comandi runtime passthrough:",
    "  help, status, db list, db show <TAB>, import status, import log [--n N --record <id> --family <family_key>], ...",
    "  import conflicts, import review <id>, import accept <id>, import batch rerun, ...",
    "",
    "Meta:",
    "  help-cli, exit, quit"
  ].join("\n");
}

async function runCommand(raw) {
  const line = String(raw || "").trim();
  if (!line) {
    return "";
  }
  if (line === "help-cli") {
    return cliHelp();
  }
  if (line === "exit" || line === "quit") {
    return "__EXIT__";
  }

  const tokens = tokenize(line);
  const cmd2 = tokens.slice(0, 2).join(" ").toLowerCase();

  if (cmd2 === "import gedcom" && hasFlag(tokens, "--file")) {
    return cmdGedcom(tokens);
  }
  if (cmd2 === "db import" && hasFlag(tokens, "--file")) {
    return cmdDbImport(tokens);
  }
  if (cmd2 === "db export") {
    return cmdDbExport(tokens);
  }
  if (cmd2 === "import herald" && hasFlag(tokens, "--file")) {
    return cmdFileAgent(tokens, "herald", "Uso: import herald --file <path.csv>");
  }
  if (cmd2 === "import notarial" && hasFlag(tokens, "--file")) {
    return cmdFileAgent(tokens, "notarial", "Uso: import notarial --file <path.xml>");
  }
  if (cmd2 === "import nobility" && hasFlag(tokens, "--file")) {
    return cmdFileAgent(tokens, "nobility", "Uso: import nobility --file <path.json>");
  }
  if (cmd2 === "import gedcom" || cmd2 === "db import" || cmd2 === "import herald" || cmd2 === "import notarial" || cmd2 === "import nobility") {
    return "Comando con file: usa --file <path>";
  }

  const out = await execRouter(line);
  return String(out.delta || "").trim() || "(ok)";
}

async function closeAll(exitCode) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  try {
    if (browser) {
      await browser.close();
    }
  } catch (_) { /* browser already closed, ignore */ }
  try {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill();
    }
  } catch (_) { /* process already terminated, ignore */ }
  process.exit(exitCode);
}

async function runRepl() {
  console.log("GN370 prompt shell ready. Digita `help-cli` per la guida.");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY
  });

  if (process.stdin.isTTY) {
    const ask = () => {
      rl.question("GN370> ", async (line) => {
        try {
          const result = await runCommand(line);
          if (result === "__EXIT__") {
            rl.close();
            await closeAll(0);
            return;
          }
          if (result) {
            console.log(result);
          }
        } catch (err) {
          console.error("ERR:", err && err.message ? err.message : String(err));
        }
        ask();
      });
    };
    ask();
  } else {
    for await (const line of rl) {
      try {
        const result = await runCommand(line);
        if (result === "__EXIT__") {
          break;
        }
        if (result) {
          console.log(result);
        }
      } catch (err) {
        console.error("ERR:", err && err.message ? err.message : String(err));
      }
    }
    await closeAll(0);
  }
}

async function main() {
  process.on("SIGINT", async () => {
    console.log("\nUscita...");
    await closeAll(0);
  });
  process.on("SIGTERM", async () => {
    await closeAll(0);
  });

  try {
    await initRuntime();
    await runRepl();
  } catch (err) {
    console.error("BOOT ERR:", err && err.message ? err.message : String(err));
    await closeAll(1);
  }
}

main();
