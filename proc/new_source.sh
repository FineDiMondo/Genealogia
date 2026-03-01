#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_FILE="$ROOT_DIR/data/FONTI.DAT"

if [[ $# -lt 2 ]]; then
  echo "Uso: $0 TIPO TITOLO [DATA_DOCUMENTO] [ARCHIVIO] [RIFERIMENTO] [URL] [NOTE]"
  exit 1
fi

TIPO="$1"
TITOLO="$2"
DATA_DOCUMENTO="${3:-}"
ARCHIVIO="${4:-}"
RIFERIMENTO="${5:-}"
URL="${6:-}"
NOTE="${7:-NUOVA_FONTE}"

LAST_NUM="$(awk -F'|' 'BEGIN{m=0} /^[^#]/ && NF>0 { if ($1 ~ /^S[0-9]{6}$/) { n=substr($1,2)+0; if(n>m)m=n } } END{printf "%06d", m+1}' "$DATA_FILE")"
NEW_ID="S${LAST_NUM}"

echo "${NEW_ID}|${TIPO}|${TITOLO}|${DATA_DOCUMENTO}|${ARCHIVIO}|${RIFERIMENTO}|${URL}|${NOTE}" >> "$DATA_FILE"
echo "Creata fonte: ${NEW_ID}"
echo "Template: copy/FONTI.CPY"
