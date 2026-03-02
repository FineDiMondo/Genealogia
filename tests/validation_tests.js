const fs = require("fs");

try {
  const src = fs.readFileSync("assets/js/validate.js", "utf8");
  if (!src.includes("IC-001") || !src.includes("IC-002")) {
    throw new Error("missing IC rules in validate.js");
  }
  console.log("[OK] validation tests passed");
} catch (e) {
  console.error("[FAIL] validation tests", e.message);
  process.exit(1);
}
