const fs = require("fs");

function mustInclude(path, text) {
  const src = fs.readFileSync(path, "utf8");
  if (!src.includes(text)) {
    throw new Error(`[FAIL] ${path} missing: ${text}`);
  }
}

try {
  mustInclude("assets/js/db.js", "err.exitCode = 2");
  mustInclude("index.html", "GATE_VIOLATION");
  mustInclude("index.html", "window.__GN370_DB_STATUS = \"EMPTY\"");
  console.log("[OK] gate tests passed");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
