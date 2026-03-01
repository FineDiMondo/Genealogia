#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_FILE="$ROOT_DIR/data/FAMIGLIE.DAT"

if [[ $# -lt 2 ]]; then
  echo "Uso: $0 COGNOME_FAMIGLIA MACRO_GRUPPO [TIPO] [ORIGINE] [ID_FONTI_CSV] [NOTE]"
  exit 1
fi

COGNOME_FAMIGLIA="$1"
MACRO_GRUPPO="$2"
TIPO="${3:-COLLATERALE}"
ORIGINE="${4:-}"
ID_FONTI="${5:-}"
NOTE="${6:-NUOVA_FAMIGLIA}"

LAST_NUM="$(awk -F'|' 'BEGIN{m=0} /^[^#]/ && NF>0 { if ($1 ~ /^F[0-9]{6}$/) { n=substr($1,2)+0; if(n>m)m=n } } END{printf "%06d", m+1}' "$DATA_FILE")"
NEW_ID="F${LAST_NUM}"

echo "${NEW_ID}|${COGNOME_FAMIGLIA}|${MACRO_GRUPPO}|${TIPO}|${ORIGINE}|${ID_FONTI}|${NOTE}" >> "$DATA_FILE"
echo "Creato record famiglia: ${NEW_ID}"
echo "Template: copy/FAMIGLIE.CPY"
