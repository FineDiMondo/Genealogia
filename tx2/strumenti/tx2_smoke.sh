#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TX2_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
PAGES_DIR="$TX2_DIR/pages"
UI_CSS="$TX2_DIR/ui/terminale.css"
UI_JS="$TX2_DIR/ui/terminale.js"
LOG_FILE="$TX2_DIR/logs/tx2_smoke.log"

mkdir -p "$TX2_DIR/logs"
: > "$LOG_FILE"

fail=0

log() {
  echo "$1" | tee -a "$LOG_FILE"
}

require_file() {
  f="$1"
  if [ ! -f "$f" ]; then
    log "ERRORE: file mancante $f"
    fail=1
  fi
}

require_contains() {
  f="$1"
  p="$2"
  label="$3"
  if ! grep -q "$p" "$f"; then
    log "ERRORE: $label non trovato in $f"
    fail=1
  fi
}

# Core files
require_file "$UI_CSS"
require_file "$UI_JS"
require_file "$PAGES_DIR/avvio-boot.html"
require_file "$PAGES_DIR/avvio-scelta.html"
require_file "$PAGES_DIR/console.html"
require_file "$PAGES_DIR/db-menu.html"
require_file "$PAGES_DIR/db-er.html"

# UI global checks
if [ -f "$UI_CSS" ]; then
  require_contains "$UI_CSS" "height: 100vh" "layout no-scroll height"
  require_contains "$UI_CSS" "overflow: hidden" "layout no-scroll overflow"
fi
if [ -f "$UI_JS" ]; then
  require_contains "$UI_JS" "PF3" "PF3 handler"
  require_contains "$UI_JS" "PF4" "PF4 handler"
  require_contains "$UI_JS" "PF5" "PF5 handler"
  require_contains "$UI_JS" "PF6" "PF6 handler"
  require_contains "$UI_JS" "PF12" "PF12 handler"
  require_contains "$UI_JS" "e.altKey && e.key === \"6\"" "ALT+6 fallback"
fi

# Per-page checks
for page in "$PAGES_DIR"/*.html; do
  [ -f "$page" ] || continue
  require_contains "$page" "MAPPA COMPILATA TX2" "banner compilazione"
  require_contains "$page" "id=\"area_mappa_vuota\"" "diagnostica mappa vuota"
  require_contains "$page" "id=\"area_dizionario_campi\"" "diagnostica dizionario"
  require_contains "$page" "data-pf=\"PF3\"" "PF3 bottone"
  require_contains "$page" "data-pf=\"PF4\"" "PF4 bottone"
  require_contains "$page" "data-pf=\"PF5\"" "PF5 bottone"
  require_contains "$page" "data-pf=\"PF6\"" "PF6 bottone"
  require_contains "$page" "data-pf=\"PF12\"" "PF12 bottone"
  require_contains "$page" "NOME-CAMPO" "dizionario colonne"
  require_contains "$page" "PROT" "colonna PROT"
done

# Avvio TX2 vs AS-IS
if [ -f "$PAGES_DIR/avvio-scelta.html" ]; then
  require_contains "$PAGES_DIR/avvio-scelta.html" "../../index.html" "target AS-IS primario"
  require_contains "$PAGES_DIR/avvio-scelta.html" "../index.html" "fallback AS-IS"
  require_contains "$PAGES_DIR/avvio-scelta.html" "IN-SCELTA-TRANSAZIONE" "campo scelta"
fi

# Basic internal links existence (./xxx.html) from quoted refs only
for page in "$PAGES_DIR"/*.html; do
  [ -f "$page" ] || continue
  links_tmp="$TX2_DIR/tmp/.smoke_links.tmp"
  : > "$links_tmp"
  sed -n "s/.*href=['\"]\\.\\/\\([A-Za-z0-9._-]*\\.html\\)['\"].*/\\.\\/\\1/p" "$page" >> "$links_tmp"
  sed -n "s/.*location\\.href=['\"]\\.\\/\\([A-Za-z0-9._-]*\\.html\\)['\"].*/\\.\\/\\1/p" "$page" >> "$links_tmp"
  sort -u "$links_tmp" > "$links_tmp.sorted"
  while read -r rel; do
    [ -n "$rel" ] || continue
    target="$PAGES_DIR/${rel#./}"
    if [ ! -f "$target" ]; then
      log "ERRORE: link interno rotto in $page -> $rel"
      fail=1
    fi
  done < "$links_tmp.sorted"
  rm -f "$links_tmp" "$links_tmp.sorted"
done

if [ "$fail" -ne 0 ]; then
  log "TX2 SMOKE: KO RC=8"
  exit 8
fi

log "TX2 SMOKE: OK RC=0"
exit 0
