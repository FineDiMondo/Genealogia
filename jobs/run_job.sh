#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_ID="$(date +%Y%m%d_%H%M%S)"
VERSION="$(date +%Y-%m-%d_%H%M)"
BUILD_LOG="${ROOT_DIR}/logs/build_${BUILD_ID}.log"
STAGING_DIR="${ROOT_DIR}/out/staging/${BUILD_ID}"
RELEASE_DIR="${ROOT_DIR}/out/releases/${VERSION}"
CURRENT_DIR="${ROOT_DIR}/out/current"
CONTROL_DIR="${ROOT_DIR}/control"
LOCK_FILE="${CONTROL_DIR}/build.lock"

mkdir -p "${STAGING_DIR}" "${CONTROL_DIR}" "${ROOT_DIR}/logs"

while [[ -f "${LOCK_FILE}" ]]; do
  sleep 5
done
touch "${LOCK_FILE}"
trap "rm -f '${LOCK_FILE}'" EXIT

log() {
  echo "[${BUILD_ID}] $1"
}

manifest_from_current_output() {
  local manifest_path="$1"
  local index_tmp="$2"
  local count=0
  if [[ -f "${STAGING_DIR}/indexes/search_people.json" ]]; then
    count="$(python3 - "${index_tmp}" <<'PY'
import json
import sys
from pathlib import Path
p = Path(sys.argv[1])
data = json.loads(p.read_text(encoding="utf-8"))
print(len(data) if isinstance(data, list) else 0)
PY
)"
  fi
  cat > "${manifest_path}" <<JSON
{
  "version": "${VERSION}",
  "build_time": "$(date -Iseconds)",
  "counts": {
    "people_count": ${count}
  }
}
JSON
}

{
  log "Starting Genealogy build pipeline"

  LATEST_GEDCOM=""
  if ls "${ROOT_DIR}"/genealogy/gedcom/merged/merged_*.ged >/dev/null 2>&1; then
    LATEST_GEDCOM="$(ls -t "${ROOT_DIR}"/genealogy/gedcom/merged/merged_*.ged | head -1)"
  elif [[ -f "${ROOT_DIR}/genealogy/gedcom/merged/latest.ged" ]]; then
    LATEST_GEDCOM="${ROOT_DIR}/genealogy/gedcom/merged/latest.ged"
  fi

  if [[ -n "${LATEST_GEDCOM}" ]]; then
    mkdir -p "${ROOT_DIR}/GIARDINA/02_DATA/RECORDS"
    cp "${LATEST_GEDCOM}" "${ROOT_DIR}/GIARDINA/02_DATA/RECORDS/current.ged"
    log "Found and ingested GEDCOM: ${LATEST_GEDCOM}"
  else
    log "WARNING: No GEDCOM found in genealogy/gedcom/merged/, using existing data"
  fi

  log "Running GIARDINA batch.py validate/build"
  python3 "${ROOT_DIR}/GIARDINA/03_PROG/batch.py" validate
  python3 "${ROOT_DIR}/GIARDINA/03_PROG/batch.py" build

  log "Publishing GIARDINA output to staging"
  if [[ -d "${ROOT_DIR}/GIARDINA/05_OUT/site" ]]; then
    cp -R "${ROOT_DIR}/GIARDINA/05_OUT/site/." "${STAGING_DIR}/"
  fi

  if [[ ! -f "${STAGING_DIR}/manifest.json" ]]; then
    if [[ -f "${STAGING_DIR}/search-index.json" ]]; then
      cp "${STAGING_DIR}/search-index.json" "${STAGING_DIR}/indexes.search_people.tmp.json"
      mkdir -p "${STAGING_DIR}/indexes"
      cp "${STAGING_DIR}/search-index.json" "${STAGING_DIR}/indexes/search_people.json"
      cp "${STAGING_DIR}/indexes/search_people.json" "${ROOT_DIR}/out_staging_indexes.json"
    fi
    manifest_from_current_output "${STAGING_DIR}/manifest.json" "${ROOT_DIR}/out_staging_indexes.json"
    rm -f "${ROOT_DIR}/out_staging_indexes.json" "${STAGING_DIR}/indexes.search_people.tmp.json"
  fi

  log "Promoting staging to release"
  rm -rf "${RELEASE_DIR}"
  mkdir -p "${RELEASE_DIR}"
  cp -R "${STAGING_DIR}/." "${RELEASE_DIR}/"

  log "Updating current release"
  rm -rf "${CURRENT_DIR}"
  mkdir -p "${CURRENT_DIR}"
  cp -R "${RELEASE_DIR}/." "${CURRENT_DIR}/"

  log "Publishing to PWA"
  bash "${ROOT_DIR}/jobs/90_publish_to_pwa.sh"

  log "Build complete: ${RELEASE_DIR}"
  log "Current: ${CURRENT_DIR}"
} 2>&1 | tee -a "${BUILD_LOG}"

log "Log saved to: ${BUILD_LOG}"
