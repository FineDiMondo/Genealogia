const fs = require("fs");
const path = require("path");

function mustInclude(path, snippet) {
  const src = fs.readFileSync(path, "utf8");
  if (!src.includes(snippet)) {
    throw new Error(`[FAIL] ${path} missing snippet: ${snippet}`);
  }
}

try {
  mustInclude("index.html", "assets/js/sql-runtime.js");
  mustInclude("assets/js/db.js", "GN370.SQL_RUNTIME");
  mustInclude("assets/js/sql-runtime.js", "assets/vendor/sqlite/");
  mustInclude("assets/js/sql-runtime.js", "index.mjs");
  mustInclude("assets/js/sql-runtime.js", "OpfsDb");
  mustInclude("assets/js/sql-runtime.js", "CORE_TYPED_MIRROR");
  mustInclude("assets/js/sql-runtime.js", "GN370_PERSON");
  mustInclude("db/schema.sql", "CREATE TABLE IF NOT EXISTS GN370_ROW_STORE");
  mustInclude("db/schema.sql", "CREATE TABLE IF NOT EXISTS GN370_PERSON");
  const vendorDir = path.resolve("assets/vendor/sqlite");
  if (!fs.existsSync(path.join(vendorDir, "index.mjs"))) {
    throw new Error("[FAIL] missing vendor file assets/vendor/sqlite/index.mjs");
  }
  if (!fs.existsSync(path.join(vendorDir, "sqlite3.wasm"))) {
    throw new Error("[FAIL] missing vendor file assets/vendor/sqlite/sqlite3.wasm");
  }
  console.log("[OK] sql runtime wiring checks passed");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
