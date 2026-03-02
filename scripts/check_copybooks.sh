#!/bin/bash
# scripts/check_copybooks.sh
set -euo pipefail

TABLES=(
  "PERSON" "FAMILY" "FAMILY_LINK" "EVENT" "PERSON_EVENT"
  "PLACE" "SOURCE" "CITATION" "TITLE" "TITLE_ASSIGNMENT"
  "HOUSE" "PERSON_HOUSE" "MEDIA" "HERALD" "SEAL" "JOURNAL"
)
EXIT=0
for t in "${TABLES[@]}"; do
  CPY="copybooks/GN370-${t//_/-}-REC.cpy"
  if [ ! -f "$CPY" ]; then
    echo "[FAIL] Missing copybook: $CPY"
    EXIT=1
  else
    grep -q "VERSION" "$CPY" || {
      echo "[FAIL] No VERSION in: $CPY"
      EXIT=1
    }
  fi
done

echo "[OK] Copybook check: ${#TABLES[@]} tabelle verificate"
exit $EXIT
