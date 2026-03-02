#!/bin/bash
set -euo pipefail

REQUIRED=(
  "index.html"
  "service-worker.js"
  "version.json"
  "assets/js/boot.js"
  "assets/js/state.js"
  "assets/js/db.js"
  "assets/js/router.js"
  "assets/vendor/jszip.min.js"
  "copybooks/GN370-PERSON-REC.cpy"
  "ddl/gn370_schema_v2.0.sql"
)

for f in "${REQUIRED[@]}"; do
  if [ ! -f "$f" ]; then
    echo "[FAIL] missing $f"
    exit 1
  fi
done

grep -n "GATE_VIOLATION" index.html >/dev/null || { echo "[FAIL] fetch gate not found"; exit 1; }

echo "[OK] deployment structure verified"
