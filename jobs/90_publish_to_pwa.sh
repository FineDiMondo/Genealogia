#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="${ROOT_DIR}/out/current"
DEST="${ROOT_DIR}/app/public/data"

echo "Publishing GIARDINA output to PWA..."

if [[ ! -d "${SOURCE}" ]]; then
  echo "ERROR: Source directory not found: ${SOURCE}"
  exit 1
fi

mkdir -p "${DEST}"
rm -rf "${DEST:?}/current"
cp -R "${SOURCE}" "${DEST}/current"

echo "Published to ${DEST}/current"

if [[ ! -f "${DEST}/current/manifest.json" ]]; then
  echo "WARNING: manifest.json not found!"
  exit 1
fi

echo "PWA data ready for Astro build"
exit 0
