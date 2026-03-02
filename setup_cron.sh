#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="${ROOT_DIR}/venv/bin/python"
SCRIPT="${ROOT_DIR}/gedcom_sync_orchestrator.py"
LOGFILE="${ROOT_DIR}/logs/cron.log"

if [[ ! -x "${PYTHON_BIN}" ]]; then
  echo "venv non trovato. Esegui prima ./setup.sh"
  exit 1
fi

read -rp "Ora esecuzione (HH:MM, default 08:00): " USER_TIME
RUN_TIME="${USER_TIME:-08:00}"
HH="${RUN_TIME%:*}"
MM="${RUN_TIME#*:}"

CRON_LINE="${MM} ${HH} * * * cd ${ROOT_DIR} && ${PYTHON_BIN} ${SCRIPT} --run-once >> ${LOGFILE} 2>&1"

(crontab -l 2>/dev/null; echo "${CRON_LINE}") | crontab -
echo "Cron installato: ${CRON_LINE}"
crontab -l

