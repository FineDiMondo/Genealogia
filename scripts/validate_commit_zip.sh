#!/bin/bash
set -euo pipefail

NAME=${1:-}
if [[ ! "$NAME" =~ ^[0-9]{12}\.zip$ ]]; then
  echo "[FAIL] invalid commit filename: $NAME"
  exit 1
fi

echo "[OK] commit filename valid"
