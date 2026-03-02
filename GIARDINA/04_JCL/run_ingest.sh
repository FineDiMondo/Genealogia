#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 RECORD_ID"
  exit 8
fi

python GIARDINA/03_PROG/batch.py ingest --record-id "$1"

