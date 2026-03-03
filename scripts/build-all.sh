#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGET="${1:-all}"
OUT_DIR="out/build"
RUNTIME_DB="out/runtime/gn370.sqlite"
PYTHON_CMD=()

if command -v python >/dev/null 2>&1 && python -V >/dev/null 2>&1; then
  PYTHON_CMD=(python)
elif command -v python3 >/dev/null 2>&1 && python3 -V >/dev/null 2>&1; then
  PYTHON_CMD=(python3)
elif command -v py >/dev/null 2>&1; then
  PYTHON_CMD=(py -3)
else
  echo "[GN370][ERR] Python interpreter not found (python3/python/py)." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "[GN370] target=$TARGET"
echo "[GN370] vendor sqlite wasm"
node scripts/vendorize-sqlite-wasm.js
echo "[GN370] recreate embedded SQLite runtime DB"
"${PYTHON_CMD[@]}" scripts/recreate_sqlite.py --schema db/schema.sql --db "$RUNTIME_DB"

echo "[GN370] static checks"
node tests/gate_tests.js
node tests/validation_tests.js

function build_target() {
  local name="$1"
  local dir="$OUT_DIR/$name"
  mkdir -p "$dir"
  cat >"$dir/BUILD_INFO.txt" <<EOF
GN370 build target: $name
timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
sqlite_db: $RUNTIME_DB
notes:
- compile native core with per-platform toolchain (CMake + cross compiler)
- package UI shell + assets + schema.sql
- keep deterministic DB reset at startup
EOF
}

if [[ "$TARGET" == "all" || "$TARGET" == "windows" ]]; then
  build_target "windows"
fi
if [[ "$TARGET" == "all" || "$TARGET" == "macos" ]]; then
  build_target "macos"
fi
if [[ "$TARGET" == "all" || "$TARGET" == "linux" ]]; then
  build_target "linux"
fi
if [[ "$TARGET" == "all" || "$TARGET" == "android" ]]; then
  build_target "android"
fi

echo "[GN370] build artifacts under $OUT_DIR"
