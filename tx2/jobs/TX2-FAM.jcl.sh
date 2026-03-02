#!/usr/bin/env sh
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TX2_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
MODULO=TX2-FAM
LOG_DIR="$TX2_DIR/logs"
TMP_DIR="$TX2_DIR/tmp"
mkdir -p "$LOG_DIR" "$TMP_DIR"
SPOOL="$LOG_DIR/${MODULO}-$(date '+%Y%m%d-%H%M%S').log"
REPORT="$TMP_DIR/${MODULO}-report.txt"
step(){ n="$1"; shift; echo "[$(date '+%Y-%m-%d %H:%M:%S')] $n START" | tee -a "$SPOOL"; "$@" >> "$SPOOL" 2>&1 || { rc=$?; echo "[$(date '+%Y-%m-%d %H:%M:%S')] $n FAIL RC=$rc" | tee -a "$SPOOL"; exit "$rc"; }; echo "[$(date '+%Y-%m-%d %H:%M:%S')] $n END RC=0" | tee -a "$SPOOL"; }
step STEP00-VERIFICA-COERENZA sh "$TX2_DIR/strumenti/tx2_verifica_coerenza.sh"
step STEP01-DCLGEN sh "$TX2_DIR/strumenti/tx2_dclgen.sh"
step STEP02-GENERA-ER sh "$TX2_DIR/strumenti/tx2_er_gen.sh"
step STEP03-COMPILA-MAPPE sh "$TX2_DIR/strumenti/tx2_compila_mappe.sh"
step STEP04-REPORT sh -c "echo MODULO=${MODULO} > '$REPORT'; echo ESITO=OK >> '$REPORT'; echo TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S') >> '$REPORT'"
echo "SPOOL: $SPOOL"
