export const ENV_CONFIG = {
  DEV: { dataBasePath: "/data/current" },
  TEST: { dataBasePath: "/data/current" },
  STAGING: { dataBasePath: "/data/current" },
  PROD: { dataBasePath: "/data/current" }
};

export function getCurrentEnv() {
  const fromMeta = document
    .querySelector('meta[name="gestionale-env"]')
    ?.getAttribute("content");
  return (fromMeta || "PROD").toUpperCase();
}

export function getDataBasePath() {
  const env = getCurrentEnv();
  return ENV_CONFIG[env]?.dataBasePath ?? "/data/current";
}

