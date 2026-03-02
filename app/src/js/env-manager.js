const BASE_URL = import.meta.env.BASE_URL || "/";
const DATA_BASE_PATH = `${BASE_URL}data/current`.replace(/\/+$/, "");

export const ENV_CONFIG = {
  DEV: { dataBasePath: DATA_BASE_PATH },
  TEST: { dataBasePath: DATA_BASE_PATH },
  STAGING: { dataBasePath: DATA_BASE_PATH },
  PROD: { dataBasePath: DATA_BASE_PATH }
};

export function getCurrentEnv() {
  const fromMeta = document
    .querySelector('meta[name="gestionale-env"]')
    ?.getAttribute("content");
  return (fromMeta || "PROD").toUpperCase();
}

export function getDataBasePath() {
  const env = getCurrentEnv();
  return ENV_CONFIG[env]?.dataBasePath ?? DATA_BASE_PATH;
}

