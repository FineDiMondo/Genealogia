#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TX2_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
DDL_DIR="$TX2_DIR/schema/ddl"
DCLGEN_DIR="$TX2_DIR/schema/dclgen"
DDL_LIST="persone.sql famiglie.sql matrimoni.sql figliazioni.sql titoli.sql proprieta.sql araldica.sql fonti.sql collegamenti_fonti.sql"

mkdir -p "$DCLGEN_DIR"
rm -f "$DCLGEN_DIR"/*.cpy 2>/dev/null || true

for fname in $DDL_LIST; do
  ddl="$DDL_DIR/$fname"
  [ -f "$ddl" ] || continue
  awk -v outdir="$DCLGEN_DIR" '
    /CREATE TABLE IF NOT EXISTS/ {
      table=toupper($6)
      gsub(/\(/, "", table)
      file=outdir "/" table "-DCLGEN.cpy"
      print "      * DCLGEN GENERATO DA DDL - NON MODIFICARE" > file
      print "       01 REC-" table "." >> file
      next
    }
    /-- COBOL=/ && file != "" {
      if (match($0, /COBOL=([A-Z0-9-]+)[[:space:]]+PIC[[:space:]]+([X9]\([0-9]+\))/, m)) {
        printf("           05 %-28s PIC %s.\n", m[1], m[2]) >> file
      }
    }
    /^\);/ { file="" }
  ' "$ddl"
done

echo "DCLGEN TX2 aggiornati in $DCLGEN_DIR"
