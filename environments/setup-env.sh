#!/bin/bash
# setup-env.sh ? GN370 environment switcher
# Usage: ./setup-env.sh [dev|test|prod]

set -euo pipefail

ENV=${1:-dev}
VALID_ENVS=("dev" "test" "prod")

if [[ ! " ${VALID_ENVS[*]} " =~ " ${ENV} " ]]; then
  echo "[GN370] Ambiente non valido: $ENV"
  echo "[GN370] Validi: dev, test, prod"
  exit 1
fi

echo "[GN370] Switching to environment: $ENV"
cp "environments/${ENV}/gn370.${ENV}.properties" assets/config/gn370.properties
cp "environments/${ENV}/.env.${ENV}" .env

node -e "
const fs=require('fs');
const p='version.json';
const v=JSON.parse(fs.readFileSync(p,'utf8'));
v.env=process.argv[1];
v.build_ts=new Date().toISOString();
fs.writeFileSync(p, JSON.stringify(v,null,2));
" "$ENV"

echo "[GN370] Environment $ENV configurato."
echo "[GN370] Esegui: bash scripts/verify_deployment.sh per verifica."
