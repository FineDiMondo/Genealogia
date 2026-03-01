#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_FILE="$ROOT_DIR/data/PERSONE.DAT"

if [[ $# -lt 5 ]]; then
  echo "Uso: $0 GEDCOM_ID COGNOME NOME SESSO ID_FAMIGLIA [ID_FONTI_CSV] [NOTE]"
  exit 1
fi

GED="$1"; COG="$2"; NOM="$3"; SEX="$4"; FAM="$5"; SRC="${6:-S000001}"; NOTE="${7:-MANUALE}"
if [[ ! "$SEX" =~ ^(M|F|U)$ ]]; then echo "SESSO non valido"; exit 1; fi
NUM="$(awk -F'|' 'BEGIN{m=0} /^[^#]/ {if($1~/^P[0-9]{6}$/){n=substr($1,2)+0;if(n>m)m=n}} END{printf "%06d",m+1}' "$DATA_FILE")"
PID="P${NUM}"
echo "${PID}|${GED}|${COG}|${NOM}|${SEX}|||||${FAM}|${FAM}|${SRC}|${NOTE}" >> "$DATA_FILE"
echo "OK ${PID}"
