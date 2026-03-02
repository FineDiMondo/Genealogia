#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TX2_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
DDL_DIR="$TX2_DIR/schema/ddl"
DCLGEN_DIR="$TX2_DIR/schema/dclgen"
COPY_DIR="$TX2_DIR/copybooks"
ER_JSON="$TX2_DIR/schema/er/er_modello.json"
LOG_FILE="$TX2_DIR/logs/tx2_verifica_coerenza.log"
TMP_DIR="$TX2_DIR/tmp"
DDL_LIST="persone.sql famiglie.sql matrimoni.sql figliazioni.sql titoli.sql proprieta.sql araldica.sql fonti.sql collegamenti_fonti.sql"

mkdir -p "$TMP_DIR" "$TX2_DIR/logs"
: > "$LOG_FILE"

log() {
  echo "$1" | tee -a "$LOG_FILE"
}

FAIL=0

"$TX2_DIR/strumenti/tx2_dclgen.sh" >/dev/null
"$TX2_DIR/strumenti/tx2_er_gen.sh" >/dev/null

# 1) Ogni COBOL in DDL esiste nel DCLGEN corrispondente
for fname in $DDL_LIST; do
  ddl="$DDL_DIR/$fname"
  [ -f "$ddl" ] || continue
  awk '
    /CREATE TABLE IF NOT EXISTS/ {
      tab=toupper($6)
      gsub(/\(/,"",tab)
      next
    }
    /-- COBOL=/ {
      if (match($0, /COBOL=([A-Z0-9-]+)[[:space:]]+PIC[[:space:]]+([X9]\([0-9]+\))/, m)) {
        print tab "|" m[1] "|" m[2]
      }
    }
  ' "$ddl" > "$TMP_DIR/.chk_multi.tmp"

  while IFS='|' read -r tab cob pic; do
    [ -n "$tab" ] || continue
    dcl="$DCLGEN_DIR/${tab}-DCLGEN.cpy"
    if [ ! -f "$dcl" ]; then
      log "ERRORE: DCLGEN mancante per $tab"
      FAIL=1
      continue
    fi
    if ! grep -q "${cob}[[:space:]]\+PIC ${pic}\." "$dcl"; then
      log "ERRORE: DDL->DCLGEN non coerente ${tab} ${cob} ${pic}"
      FAIL=1
    fi
  done < "$TMP_DIR/.chk_multi.tmp"
  rm -f "$TMP_DIR/.chk_multi.tmp"
done

# 2) PK/FK in DDL presenti in ER model
for fname in $DDL_LIST; do
  ddl="$DDL_DIR/$fname"
  [ -f "$ddl" ] || continue
  awk '
    /CREATE TABLE IF NOT EXISTS/ {
      tab=toupper($6)
      gsub(/\(/,"",tab)
      next
    }
    /-- COBOL=/ {
      ruolo="N"
      if ($0 ~ / PK/) ruolo="PK"
      if ($0 ~ /FK=/) ruolo="FK"
      if (match($0, /COBOL=([A-Z0-9-]+)/, m)) {
        print tab "|" m[1] "|" ruolo
      }
    }
  ' "$ddl" > "$TMP_DIR/.chk_er.tmp"

  while IFS='|' read -r tab cob ruolo; do
    [ -n "$cob" ] || continue
    if [ "$ruolo" = "PK" ]; then
      if ! grep -q "\"entita\":\"$tab\".*\"nome_cobol\":\"$cob\".*\"ruolo\":\"PK\"" "$ER_JSON"; then
        log "ERRORE: PK non presente in ER ${tab}.${cob}"
        FAIL=1
      fi
    fi
    if [ "$ruolo" = "FK" ]; then
      if ! grep -q "\"entita\":\"$tab\".*\"nome_cobol\":\"$cob\".*\"ruolo\":\"FK\"" "$ER_JSON"; then
        log "ERRORE: FK non presente in ER ${tab}.${cob}"
        FAIL=1
      fi
    fi
  done < "$TMP_DIR/.chk_er.tmp"
  rm -f "$TMP_DIR/.chk_er.tmp"
done

# 3) Campi chiave COPY TX coerenti con DB-ID-* nei DCLGEN
awk '/DB-ID-/{
  nome=$2
  pic=$4
  gsub(/\./,"",pic)
  print nome "|" pic
}' "$DCLGEN_DIR"/*-DCLGEN.cpy > "$TMP_DIR/.db_id_pic.tmp"

for cpy in "$COPY_DIR"/TX2-*-IO.cpy; do
  [ -f "$cpy" ] || continue
  awk '/IN-ID-/{
    nome=$2
    pic=$4
    gsub(/\./,"",pic)
    sub(/^IN-/,"DB-",nome)
    print nome "|" pic
  }' "$cpy" > "$TMP_DIR/.tx_id_pic.tmp"

  while IFS='|' read -r dbname txpic; do
    [ -n "$dbname" ] || continue
    dbpic=$(awk -F'|' -v n="$dbname" '$1==n{print $2; exit}' "$TMP_DIR/.db_id_pic.tmp")
    if [ -z "$dbpic" ]; then
      log "ERRORE: chiave TX senza riferimento DB ${dbname}"
      FAIL=1
    elif [ "$dbpic" != "$txpic" ]; then
      log "ERRORE: PIC incoerente ${dbname} DB=${dbpic} TX=${txpic}"
      FAIL=1
    fi
  done < "$TMP_DIR/.tx_id_pic.tmp"
done

rm -f "$TMP_DIR/.db_id_pic.tmp" "$TMP_DIR/.tx_id_pic.tmp"

if [ "$FAIL" -ne 0 ]; then
  log "VERIFICA COERENZA KO RC=8"
  exit 8
fi

log "VERIFICA COERENZA OK RC=0"
exit 0
