#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT_DIR}"

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

mkdir -p genealogy/gedcom/ancestry
mkdir -p genealogy/gedcom/familysearch
mkdir -p genealogy/gedcom/merged
mkdir -p genealogy/gedcom/archive
mkdir -p logs

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Creato .env da .env.example (completa le credenziali)."
fi

echo "Setup completato."
echo "Run test: python gedcom_sync_orchestrator.py --run-once"

