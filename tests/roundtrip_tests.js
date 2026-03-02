const fs = require("fs");

try {
  const sample = fs.readFileSync("test-fixtures/sample-db.zip");
  if (!sample || sample.length === 0) throw new Error("empty sample-db.zip");
  console.log("[OK] roundtrip precondition fixture present");
} catch (e) {
  console.error("[FAIL] roundtrip test", e.message);
  process.exit(1);
}
