#!/bin/bash
# scripts/check_copybooks.sh
set -euo pipefail

TABLES=(
  "PERSON" "FAMILY" "FAMILY_LINK" "EVENT" "PERSON_EVENT"
  "PLACE" "SOURCE" "CITATION" "TITLE" "TITLE_ASSIGNMENT"
  "HOUSE" "PERSON_HOUSE" "MEDIA" "HERALD" "SEAL" "JOURNAL"
)
PIPELINE_COPYBOOKS=(
  "copybooks/GN370-GEDCOM-TOKEN.cpy"
  "copybooks/GN370-RAW-RECORD.cpy"
  "copybooks/GN370-NORM-RECORD.cpy"
  "copybooks/GN370-CONFLICT-REPORT.cpy"
  "copybooks/GN370-IMPORT-LOG.cpy"
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

for cp in "${PIPELINE_COPYBOOKS[@]}"; do
  if [ ! -f "$cp" ]; then
    echo "[FAIL] Missing pipeline copybook: $cp"
    EXIT=1
  else
    grep -q "VERSION" "$cp" || {
      echo "[FAIL] No VERSION in: $cp"
      EXIT=1
    }
  fi
done

echo "[OK] Copybook check: ${#TABLES[@]} tabelle verificate"
exit $EXIT
