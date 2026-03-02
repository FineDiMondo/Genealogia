#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/app"

PASS=0
WARN=0
FAIL=0

ok() {
  printf "PASS: %s\n" "$1"
  PASS=$((PASS + 1))
}

warn() {
  printf "WARN: %s\n" "$1"
  WARN=$((WARN + 1))
}

ko() {
  printf "FAIL: %s\n" "$1"
  FAIL=$((FAIL + 1))
}

section() {
  printf "\n== %s ==\n" "$1"
}

# Git Bash on Windows often misses standard install paths.
if [[ -d "/c/Program Files/nodejs" ]]; then
  export PATH="$PATH:/c/Program Files/nodejs"
fi
if [[ -d "/c/Users/$USERNAME/.bun/bin" ]]; then
  export PATH="$PATH:/c/Users/$USERNAME/.bun/bin"
fi

section "Git status"
if git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ok "Repository git rilevato"
else
  ko "Repository git non trovato"
fi

BRANCH="$(git -C "$ROOT_DIR" branch --show-current 2>/dev/null || true)"
if [[ -n "$BRANCH" ]]; then
  ok "Branch corrente: $BRANCH"
else
  warn "Impossibile determinare il branch corrente"
fi

if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
  warn "Working tree non pulito (modifiche presenti)"
else
  ok "Working tree pulito"
fi

section "Directory e file critici"
for path in \
  "app/src/pages/index.astro" \
  "app/src/layouts/GestionalLayout.astro" \
  "app/src/components/Navigation.astro" \
  "app/src/styles/terminal-web.css" \
  "GIARDINA/03_PROG/batch.py" \
  "jobs/run_job.sh" \
  "jobs/90_publish_to_pwa.sh"
do
  if [[ -e "$ROOT_DIR/$path" ]]; then
    ok "$path presente"
  else
    ko "$path mancante"
  fi
done

section "Tooling Node/Astro"
if command -v node >/dev/null 2>&1; then
  ok "node disponibile ($(node -v))"
else
  ko "node non disponibile"
fi

if command -v npm >/dev/null 2>&1; then
  ok "npm disponibile ($(npm -v))"
else
  ko "npm non disponibile"
fi

if [[ -d "$APP_DIR/node_modules" ]]; then
  ok "node_modules presenti"
else
  warn "node_modules assenti (eseguire: cd app && npm ci)"
fi

if [[ -f "$APP_DIR/package.json" ]]; then
  ok "package.json presente"
else
  ko "package.json mancante in app/"
fi

if command -v npm >/dev/null 2>&1 && [[ -f "$APP_DIR/package.json" ]]; then
  if (cd "$APP_DIR" && npm run build >/tmp/genealogia_astro_build.log 2>&1); then
    ok "Astro build completata"
  else
    if grep -q "Cannot find module '.*dist\\\\renderers\\.mjs'" /tmp/genealogia_astro_build.log; then
      warn "Astro build fallita in Git Bash per path issue noto (renderers.mjs); verificare build da PowerShell"
    else
      ko "Astro build fallita (vedi /tmp/genealogia_astro_build.log)"
    fi
  fi
else
  warn "Build Astro saltata per tooling non disponibile"
fi

section "Pipeline COBOL-like / GIARDINA"
if command -v python >/dev/null 2>&1; then
  if python --version >/dev/null 2>&1; then
    if (cd "$ROOT_DIR" && python -m py_compile GIARDINA/03_PROG/batch.py >/dev/null 2>&1); then
      ok "batch.py compilabile"
    else
      ko "batch.py non compilabile"
    fi
  else
    warn "python presente ma non configurato correttamente"
  fi
elif command -v python3 >/dev/null 2>&1; then
  if python3 --version >/dev/null 2>&1; then
    if (cd "$ROOT_DIR" && python3 -m py_compile GIARDINA/03_PROG/batch.py >/dev/null 2>&1); then
      ok "batch.py compilabile"
    else
      ko "batch.py non compilabile"
    fi
  else
    warn "python3 presente ma non configurato correttamente"
  fi
elif [[ -x "/c/Windows/py.exe" ]]; then
  if "/c/Windows/py.exe" -3 --version >/dev/null 2>&1; then
    if (cd "$ROOT_DIR" && "/c/Windows/py.exe" -3 -m py_compile GIARDINA/03_PROG/batch.py >/dev/null 2>&1); then
      ok "batch.py compilabile"
    else
      ko "batch.py non compilabile"
    fi
  else
    warn "Python launcher rilevato ma runtime non installato/configurato"
  fi
else
  warn "python non disponibile: check batch.py saltato"
fi

if [[ -d "$ROOT_DIR/out/current" ]]; then
  ok "out/current presente"
else
  warn "out/current assente (eseguire pipeline jobs/run_job.sh)"
fi

if [[ -d "$ROOT_DIR/app/public/data/current" ]]; then
  ok "app/public/data/current presente"
else
  warn "app/public/data/current assente (eseguire jobs/90_publish_to_pwa.sh)"
fi

if [[ -f "$ROOT_DIR/app/public/data/current/manifest.json" ]]; then
  ok "manifest.json pubblicato in app/public/data/current"
else
  warn "manifest.json non trovato in app/public/data/current"
fi

section "Report finale"
printf "PASS=%d WARN=%d FAIL=%d\n" "$PASS" "$WARN" "$FAIL"

if [[ "$FAIL" -gt 0 ]]; then
  printf "ESITO: KO\n"
  exit 1
fi

printf "ESITO: OK\n"
exit 0
