#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[up] Build gnx CLI"
make -C tooling/gnx

echo "[up] Init workspace"
./build/gnx/gnx init

echo "[up] Environment ready"
