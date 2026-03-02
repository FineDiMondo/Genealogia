#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 RECORD_ID [--with-hash]"
  exit 1
fi

if [[ "${2:-}" == "--with-hash" ]]; then
  python -m src.portale_giardina.pipeline ingest --record-id "$1" --with-hash
else
  python -m src.portale_giardina.pipeline ingest --record-id "$1"
fi
