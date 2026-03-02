#!/bin/bash
set -euo pipefail

if rg -n "TODO_DISABLE_GATE|AUTOLOAD_SAMPLE|BOOT_FETCH_DATA" assets/js >/dev/null 2>&1; then
  echo "[FAIL] forbidden pattern found"
  exit 1
fi

echo "[OK] static analysis clean"
