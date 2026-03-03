const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SETUP_SCRIPT = path.join(ROOT, "environments", "setup-env.js");

let PASS = 0;
let FAIL = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`[PASS] ${label}`);
    PASS += 1;
  } else {
    console.log(`[FAIL] ${label}`);
    FAIL += 1;
  }
}

function runSetup(env) {
  const res = spawnSync(process.execPath, [SETUP_SCRIPT, env], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (res.status !== 0) {
    const err = new Error(`setup-env.js failed for ${env}`);
    err.stdout = res.stdout || "";
    err.stderr = res.stderr || "";
    throw err;
  }
  return res;
}

function fileIncludes(relativePath, text) {
  const src = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
  return src.includes(text);
}

function snapshot(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return { exists: false };
  }
  return {
    exists: true,
    content: fs.readFileSync(absolutePath, "utf8"),
  };
}

function restore(relativePath, state) {
  const absolutePath = path.join(ROOT, relativePath);
  if (state.exists) {
    fs.writeFileSync(absolutePath, state.content, "utf8");
    return;
  }
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

const originalEnv = snapshot(".env");
const originalVersion = snapshot("version.json");
const originalGn370Props = snapshot(path.join("assets", "config", "gn370.properties"));

try {
  try {
    runSetup("dev");
    assert(fileIncludes(".env", "GN370_ENV=dev"), "ENV-001: dev .env configurato");
  } catch (_e) {
    assert(false, "ENV-001: dev .env configurato");
  }

  try {
    runSetup("prod");
    assert(fileIncludes(".env", "GN370_ENV=prod"), "ENV-002: prod .env configurato");
  } catch (_e) {
    assert(false, "ENV-002: prod .env configurato");
  }

  try {
    const version = JSON.parse(fs.readFileSync(path.join(ROOT, "version.json"), "utf8"));
    assert(version.env === "prod", 'ENV-003: version.json env=prod');
  } catch (_e) {
    assert(false, 'ENV-003: version.json env=prod');
  }

  try {
    runSetup("dev");
    runSetup("dev");
    assert(fileIncludes(".env", "GN370_ENV=dev"), "ENV-004: doppio switch dev idempotente");
  } catch (_e) {
    assert(false, "ENV-004: doppio switch dev idempotente");
  }

  try {
    runSetup("staging");
    assert(false, "ENV-005: ambiente invalido rejected");
  } catch (e) {
    const out = `${e.stdout || ""}\n${e.stderr || ""}`;
    assert(out.includes("non valido"), "ENV-005: ambiente invalido rejected");
  }
} finally {
  restore(".env", originalEnv);
  restore("version.json", originalVersion);
  restore(path.join("assets", "config", "gn370.properties"), originalGn370Props);
}

console.log("");
console.log(`Risultati: ${PASS} PASS, ${FAIL} FAIL`);
process.exit(FAIL === 0 ? 0 : 1);
