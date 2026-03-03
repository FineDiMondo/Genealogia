#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pkgDir = path.join(root, "node_modules", "@sqlite.org", "sqlite-wasm");
const distDir = path.join(pkgDir, "dist");
const outDir = path.join(root, "assets", "vendor", "sqlite");

function copyDist() {
  if (!fs.existsSync(distDir)) {
    throw new Error("sqlite-wasm dist not found. Run: npm install \"@sqlite.org/sqlite-wasm\"");
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.cpSync(distDir, outDir, { recursive: true });
}

function writeMetadata() {
  const pkgJsonPath = path.join(pkgDir, "package.json");
  if (!fs.existsSync(pkgJsonPath)) {
    return;
  }
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  const meta = {
    name: pkg.name,
    version: pkg.version,
    copied_at: new Date().toISOString(),
    source: "@sqlite.org/sqlite-wasm/dist"
  };
  fs.writeFileSync(path.join(outDir, "VENDOR_INFO.json"), JSON.stringify(meta, null, 2));
}

function main() {
  copyDist();
  writeMetadata();
  const files = fs.readdirSync(outDir).sort();
  console.log("[OK] sqlite wasm vendored to", outDir);
  console.log("[OK] files:", files.join(", "));
}

main();
