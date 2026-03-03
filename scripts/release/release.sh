#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

make -C tooling/gnx
./build/gnx/gnx package
sha256sum artifacts/gnx-bundle.tgz > artifacts/gnx-bundle.tgz.sha256

echo "Release bundle created in artifacts/"
