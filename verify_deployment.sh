#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PASS=0
WARN=0
FAIL=0

ok() { printf "PASS: %s\n" "$1"; PASS=$((PASS + 1)); }
warn() { printf "WARN: %s\n" "$1"; WARN=$((WARN + 1)); }
ko() { printf "FAIL: %s\n" "$1"; FAIL=$((FAIL + 1)); }
section() { printf "\n== %s ==\n" "$1"; }

section "Static 370 root"
if [[ -d "$ROOT_DIR/PORTALE_GN" ]]; then
  STATIC_ROOT="$ROOT_DIR/PORTALE_GN"
  ok "STATIC_ROOT=PORTALE_GN"
elif [[ -d "$ROOT_DIR/out/current/site" ]]; then
  STATIC_ROOT="$ROOT_DIR/out/current/site"
  ok "STATIC_ROOT=out/current/site"
else
  ko "Nessuna root statica trovata (PORTALE_GN/ o out/current/site/)"
  STATIC_ROOT="$ROOT_DIR"
fi

section "Homepage"
if [[ -f "$STATIC_ROOT/index.html" ]]; then
  ok "index.html presente in root statica"
else
  ko "index.html mancante in root statica"
fi

if command -v curl >/dev/null 2>&1; then
  if [[ -f "$STATIC_ROOT/index.html" ]]; then
    if curl -s "file://$STATIC_ROOT/index.html" | grep -qi "GN370\|COMMAND ===>\|SIG-GN\|IBM SYSTEM/370"; then
      ok "homepage riconosciuta come shell 370"
    else
      ko "homepage non riconosciuta come shell 370"
    fi
  fi
else
  warn "curl non disponibile: check homepage via curl saltato"
fi

section "Version metadata"
if [[ -f "$ROOT_DIR/version.json" ]]; then
  ok "version.json presente"
else
  ko "version.json mancante"
fi

section "No Astro/PWA active refs"
if grep -RIn --exclude-dir=.git --exclude-dir=legacy --exclude-dir=node_modules "app/\|pages-astro\|manifest.webmanifest\|dist/" "$ROOT_DIR" >/tmp/genealogia_deploy_refs.log 2>/dev/null; then
  warn "Riferimenti legacy trovati fuori da legacy/ (vedi /tmp/genealogia_deploy_refs.log)"
else
  ok "Nessun riferimento attivo a app/, pages-astro, manifest.webmanifest, dist/"
fi

section "Report finale"
printf "PASS=%d WARN=%d FAIL=%d\n" "$PASS" "$WARN" "$FAIL"
if [[ "$FAIL" -gt 0 ]]; then
  printf "ESITO: KO\n"
  exit 1
fi
printf "ESITO: OK\n"
exit 0