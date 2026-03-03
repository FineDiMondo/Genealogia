#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const REQUIRED = [
  "index.html",
  "service-worker.js",
  "version.json",
  "assets/js/boot.js",
  "assets/js/state.js",
  "assets/js/db.js",
  "assets/js/router.js",
  "assets/vendor/jszip.min.js",
  "copybooks/GN370-PERSON-REC.cpy",
  "ddl/gn370_schema_v2.0.sql",
];

function fail(message) {
  console.error(`[FAIL] ${message}`);
  process.exit(1);
}

for (const relPath of REQUIRED) {
  const absolutePath = path.join(ROOT, relPath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    fail(`missing ${relPath}`);
  }
}

const indexPath = path.join(ROOT, "index.html");
const indexSrc = fs.readFileSync(indexPath, "utf8");
if (!indexSrc.includes("GATE_VIOLATION")) {
  fail("fetch gate not found");
}

console.log("[OK] deployment structure verified");
