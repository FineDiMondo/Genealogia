#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TX2_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
DDL_DIR="$TX2_DIR/schema/ddl"
ER_DIR="$TX2_DIR/schema/er"
OUT_JSON="$ER_DIR/er_modello.json"
TMP_FIELDS="$TX2_DIR/tmp/.er_fields.tmp"
TMP_RELS="$TX2_DIR/tmp/.er_rels.tmp"
DDL_LIST="persone.sql famiglie.sql matrimoni.sql figliazioni.sql titoli.sql proprieta.sql araldica.sql fonti.sql collegamenti_fonti.sql"

mkdir -p "$ER_DIR" "$TX2_DIR/tmp"
: > "$TMP_FIELDS"
: > "$TMP_RELS"

for fname in $DDL_LIST; do
  ddl="$DDL_DIR/$fname"
  [ -f "$ddl" ] || continue
  awk '
    /CREATE TABLE IF NOT EXISTS/ {
      tab=toupper($6)
      gsub(/\(/, "", tab)
      next
    }
    /-- COBOL=/ {
      col=$1
      gsub(/,/, "", col)
      ruolo="N"
      fk_tab=""
      fk_campo=""
      if ($0 ~ / PK/) ruolo="PK"
      if (match($0, /FK=([A-Z0-9_]+)\(([A-Z0-9-]+)\)/, fk)) {
        ruolo="FK"
        fk_tab=fk[1]
        fk_campo=fk[2]
      }
      if (match($0, /COBOL=([A-Z0-9-]+)[[:space:]]+PIC[[:space:]]+([X9]\([0-9]+\))/, m)) {
        printf("%s|%s|%s|%s|%s|%s|%s\n", tab, col, m[1], m[2], ruolo, fk_tab, fk_campo)
      }
    }
  ' "$ddl" >> "$TMP_FIELDS"
done

awk -F'|' '$5=="FK" {printf("%s|%s|%s|%s\n",$1,$3,$6,$7)}' "$TMP_FIELDS" > "$TMP_RELS"

{
  echo "{"
  echo "  \"entita\": ["
  tables=$(awk -F'|' '{print $1}' "$TMP_FIELDS" | awk '!seen[$0]++')
  tcount=$(printf '%s\n' "$tables" | sed '/^$/d' | wc -l | tr -d ' ')
  tidx=0
  for t in $tables; do
    tidx=$((tidx+1))
    echo "    {\"nome\":\"$t\",\"campi\":["
    awk -F'|' -v T="$t" '$1==T{print}' "$TMP_FIELDS" > "$TX2_DIR/tmp/.er_${t}.tmp"
    ccount=$(wc -l < "$TX2_DIR/tmp/.er_${t}.tmp" | tr -d ' ')
    cidx=0
    while IFS='|' read -r ent col cob pic ruolo fkt fkf; do
      cidx=$((cidx+1))
      fkref=""
      if [ -n "$fkt" ]; then fkref="${fkt}(${fkf})"; fi
      comma=","; [ "$cidx" -eq "$ccount" ] && comma=""
      echo "      {\"nome_sql\":\"$col\",\"nome_cobol\":\"$cob\",\"pic\":\"$pic\",\"ruolo\":\"$ruolo\",\"fk_ref\":\"$fkref\"}$comma"
    done < "$TX2_DIR/tmp/.er_${t}.tmp"
    rm -f "$TX2_DIR/tmp/.er_${t}.tmp"
    endcomma=","; [ "$tidx" -eq "$tcount" ] && endcomma=""
    echo "    ]}$endcomma"
  done
  echo "  ],"

  echo "  \"relazioni\": ["
  rcount=$(wc -l < "$TMP_RELS" | tr -d ' ')
  ridx=0
  while IFS='|' read -r sent scampo dent dcampo; do
    [ -n "$sent" ] || continue
    ridx=$((ridx+1))
    comma=","; [ "$ridx" -eq "$rcount" ] && comma=""
    echo "    {\"sorgente_entita\":\"$sent\",\"sorgente_campo\":\"$scampo\",\"destinazione_entita\":\"$dent\",\"destinazione_campo\":\"$dcampo\"}$comma"
  done < "$TMP_RELS"
  echo "  ],"

  echo "  \"campi_flat\": ["
  fcount=$(wc -l < "$TMP_FIELDS" | tr -d ' ')
  fidx=0
  while IFS='|' read -r ent col cob pic ruolo fkt fkf; do
    fidx=$((fidx+1))
    fkref=""
    if [ -n "$fkt" ]; then fkref="${fkt}(${fkf})"; fi
    comma=","; [ "$fidx" -eq "$fcount" ] && comma=""
    echo "    {\"entita\":\"$ent\",\"nome_sql\":\"$col\",\"nome_cobol\":\"$cob\",\"pic\":\"$pic\",\"ruolo\":\"$ruolo\",\"fk_ref\":\"$fkref\"}$comma"
  done < "$TMP_FIELDS"
  echo "  ]"
  echo "}"
} > "$OUT_JSON"

rm -f "$TMP_FIELDS" "$TMP_RELS"
echo "ER MODEL generato in $OUT_JSON"
