#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

make -C tooling/gnx
./build/gnx/gnx init
./build/gnx/gnx parse specs/individui.gnx
./build/gnx/gnx transpile specs/individui.gnx --out cobol/gen
./build/gnx/gnx build
