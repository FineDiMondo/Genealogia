#!/usr/bin/env node
// GN370 environment switcher (cross-platform)
// Usage: node environments/setup-env.js [dev|test|prod]

const fs = require("fs");
const path = require("path");

const VALID_ENVS = new Set(["dev", "test", "prod"]);

function switchEnvironment(env, rootDir = path.resolve(__dirname, "..")) {
  if (!VALID_ENVS.has(env)) {
    const err = new Error(`Ambiente non valido: ${env}`);
    err.code = "INVALID_ENV";
    throw err;
  }

  const envDir = path.join(rootDir, "environments", env);
  const srcProps = path.join(envDir, `gn370.${env}.properties`);
  const srcEnv = path.join(envDir, `.env.${env}`);
  const dstProps = path.join(rootDir, "assets", "config", "gn370.properties");
  const dstEnv = path.join(rootDir, ".env");
  const versionPath = path.join(rootDir, "version.json");

  fs.copyFileSync(srcProps, dstProps);
  fs.copyFileSync(srcEnv, dstEnv);

  const version = JSON.parse(fs.readFileSync(versionPath, "utf8"));
  version.env = env;
  version.build_ts = new Date().toISOString();
  fs.writeFileSync(versionPath, `${JSON.stringify(version, null, 2)}\n`, "utf8");
}

if (require.main === module) {
  const env = process.argv[2] || "dev";
  if (!VALID_ENVS.has(env)) {
    console.error(`[GN370] Ambiente non valido: ${env}`);
    console.error("[GN370] Validi: dev, test, prod");
    process.exit(1);
  }

  try {
    console.log(`[GN370] Switching to environment: ${env}`);
    switchEnvironment(env);
    console.log(`[GN370] Environment ${env} configurato.`);
    console.log("[GN370] Esegui: bash scripts/verify_deployment.sh per verifica.");
  } catch (e) {
    console.error(`[GN370] setup-env failed: ${e.message}`);
    process.exit(1);
  }
}

module.exports = {
  switchEnvironment,
};
