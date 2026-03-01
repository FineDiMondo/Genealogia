#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_FILE="$ROOT_DIR/data/FONTI.DAT"

if [[ $# -lt 2 ]]; then
  echo "Uso: $0 TIPO TITOLO [DATA] [ARCHIVIO] [RIF] [URL] [NOTE]"
  exit 1
fi

TIPO="$1"; TITOLO="$2"; DATA="${3:-}"; ARCH="${4:-}"; RIF="${5:-}"; URL="${6:-}"; NOTE="${7:-MANUALE}"
NUM="$(awk -F'|' 'BEGIN{m=0} /^[^#]/ {if($1~/^S[0-9]{6}$/){n=substr($1,2)+0;if(n>m)m=n}} END{printf "%06d",m+1}' "$DATA_FILE")"
SID="S${NUM}"
echo "${SID}|${TIPO}|${TITOLO}|${DATA}|${ARCH}|${RIF}|${URL}|${NOTE}" >> "$DATA_FILE"
echo "OK ${SID}"
