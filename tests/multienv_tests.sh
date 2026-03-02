#!/bin/bash
# tests/multienv_tests.sh ? GN370 multi-environment test suite

set -euo pipefail
PASS=0; FAIL=0
assert() {
  if eval "$1"; then
    echo "[PASS] $2"; ((PASS+=1))
  else
    echo "[FAIL] $2"; ((FAIL+=1))
  fi
}

./environments/setup-env.sh dev
assert "grep -q GN370_ENV=dev .env" "ENV-001: dev .env configurato"

./environments/setup-env.sh prod
assert "grep -q GN370_ENV=prod .env" "ENV-002: prod .env configurato"

assert "grep -q '\"env\": \"prod\"' version.json" "ENV-003: version.json env=prod"

./environments/setup-env.sh dev
./environments/setup-env.sh dev
assert "grep -q GN370_ENV=dev .env" "ENV-004: doppio switch dev idempotente"

OUT=$(./environments/setup-env.sh staging 2>&1 || true)
if echo "$OUT" | grep -q "non valido"; then
  assert "true" "ENV-005: ambiente invalido rejected"
else
  assert "false" "ENV-005: ambiente invalido rejected"
fi

echo ""
echo "Risultati: $PASS PASS, $FAIL FAIL"
[ $FAIL -eq 0 ] && exit 0 || exit 1
