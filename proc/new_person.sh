#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_FILE="$ROOT_DIR/data/PERSONE.DAT"

if [[ $# -lt 4 ]]; then
  echo "Uso: $0 COGNOME NOME SESSO ID_FAMIGLIA [ID_FONTI_CSV] [NOTE]"
  exit 1
fi

COGNOME="$1"
NOME="$2"
SESSO="$3"
ID_FAMIGLIA="$4"
ID_FONTI="${5:-}"
NOTE="${6:-NUOVO_RECORD}"

if [[ ! "$SESSO" =~ ^(M|F|U)$ ]]; then
  echo "Errore: SESSO deve essere M, F o U."
  exit 1
fi

LAST_NUM="$(awk -F'|' 'BEGIN{m=0} /^[^#]/ && NF>0 { if ($1 ~ /^P[0-9]{6}$/) { n=substr($1,2)+0; if(n>m)m=n } } END{printf "%06d", m+1}' "$DATA_FILE")"
NEW_ID="P${LAST_NUM}"

echo "${NEW_ID}|${COGNOME}|${NOME}|${SESSO}|||||${ID_FAMIGLIA}|${ID_FONTI}|${NOTE}|DA_VERIFICARE" >> "$DATA_FILE"
echo "Creato record persona: ${NEW_ID}"
echo "Template: copy/PERSONE.CPY"
