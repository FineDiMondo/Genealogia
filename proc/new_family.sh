#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_FILE="$ROOT_DIR/data/FAMIGLIE.DAT"

if [[ $# -lt 4 ]]; then
  echo "Uso: $0 GEDCOM_ID NOME_FAMIGLIA ID_HUSB ID_WIFE [ID_FIGLI_CSV] [DATA_MARR] [LUOGO] [ID_FONTI] [NOTE]"
  exit 1
fi

GED="$1"; NOME="$2"; HUSB="$3"; WIFE="$4"; FIGLI="${5:-}"; DATA_M="${6:-}"; LUOGO="${7:-}"; SRC="${8:-S000001}"; NOTE="${9:-MANUALE}"
NUM="$(awk -F'|' 'BEGIN{m=0} /^[^#]/ {if($1~/^F[0-9]{6}$/){n=substr($1,2)+0;if(n>m)m=n}} END{printf "%06d",m+1}' "$DATA_FILE")"
FID="F${NUM}"
echo "${FID}|${GED}|${NOME}|${HUSB}|${WIFE}|${FIGLI}|${DATA_M}|${LUOGO}|${SRC}|${NOTE}" >> "$DATA_FILE"
echo "OK ${FID}"
