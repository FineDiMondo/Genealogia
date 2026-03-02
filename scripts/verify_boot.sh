#!/bin/bash
set -euo pipefail

grep -q "window.__GN370_DB_STATUS = \"EMPTY\"" index.html || { echo "[FAIL] EMPTY status init missing"; exit 1; }
grep -q "GATE_VIOLATION" index.html || { echo "[FAIL] fetch gate missing"; exit 1; }

echo "[OK] boot guard present"
