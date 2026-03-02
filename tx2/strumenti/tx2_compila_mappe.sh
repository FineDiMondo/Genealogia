#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TX2_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
DEFS_DIR="$TX2_DIR/defs"
PAGES_DIR="$TX2_DIR/pages"
TMP_DIR="$TX2_DIR/tmp"
ER_JSON="$TX2_DIR/schema/er/er_modello.json"
TEMPLATE="$TX2_DIR/mappe/template_mappa.html"

mkdir -p "$PAGES_DIR" "$TMP_DIR"
rm -f "$PAGES_DIR"/*.html 2>/dev/null || true
[ -f "$ER_JSON" ] || sh "$TX2_DIR/strumenti/tx2_er_gen.sh"

get_value() {
  file="$1"
  key="$2"
  awk -v k="$key" '
    index($0, k ": ") == 1 {
      line=$0
      sub("^" k ": ", "", line)
      print line
      exit
    }
  ' "$file"
}

parse_fields() {
  def="$1"
  out="$2"
  awk '
    function emit() {
      if (nome != "") {
        print nome "|" etichetta "|" pic "|" riga "|" colonna "|" lunghezza "|" attributo "|" colore "|" origine
      }
    }
    BEGIN { in_fields=0; nome="" }
    {
      line=$0
      gsub(/\r/, "", line)
      if (line ~ /^fields:/) { in_fields=1; next }
      if (in_fields && line ~ /^[a-zA-Z_]+:/) { emit(); in_fields=0 }
      if (!in_fields) next

      if (line ~ /^  - nome:/) {
        emit()
        sub(/^  - nome:[[:space:]]*/, "", line)
        nome=line; gsub(/"/, "", nome)
        etichetta=""; pic=""; riga=""; colonna=""; lunghezza=""; attributo=""; colore=""; origine=""
      } else if (line ~ /^    etichetta:/) {
        sub(/^    etichetta:[[:space:]]*/, "", line)
        etichetta=line; gsub(/"/, "", etichetta)
      } else if (line ~ /^    pic:/) {
        sub(/^    pic:[[:space:]]*/, "", line)
        pic=line; gsub(/"/, "", pic)
      } else if (line ~ /^    riga:/) {
        sub(/^    riga:[[:space:]]*/, "", line)
        riga=line
      } else if (line ~ /^    colonna:/) {
        sub(/^    colonna:[[:space:]]*/, "", line)
        colonna=line
      } else if (line ~ /^    lunghezza:/) {
        sub(/^    lunghezza:[[:space:]]*/, "", line)
        lunghezza=line
      } else if (line ~ /^    attributo:/) {
        sub(/^    attributo:[[:space:]]*/, "", line)
        attributo=line
      } else if (line ~ /^    colore:/) {
        sub(/^    colore:[[:space:]]*/, "", line)
        colore=line
      } else if (line ~ /^    origine:/) {
        sub(/^    origine:[[:space:]]*/, "", line)
        origine=line
      }
    }
    END { if (in_fields) emit() }
  ' "$def" > "$out"
}

parse_details() {
  def="$1"
  out="$2"
  awk '
    BEGIN{in_details=0}
    /^details:/ {in_details=1; next}
    in_details && /^[a-zA-Z_]+:/ {in_details=0}
    in_details && /^  - / {
      line=$0
      sub(/^  - /, "", line)
      gsub(/"/, "", line)
      print line
    }
  ' "$def" > "$out"
}

make_messages() {
  msg="$1"
  out="$2"
  {
    printf "%s\n" "$msg"
    echo ""
    echo ""
  } > "$out"
}

make_griglia() {
  fields="$1"
  out="$2"
  {
    echo "FORMATO AREA CAMPI (24x80)"
    echo "NOME-CAMPO                      PIC          RIGA COL  LEN ATTR"
    echo "------------------------------  -----------  ---- ---- --- -------"
    awk -F'|' '{
      attr=$7
      short="PROT"
      if (attr=="MODIFICABILE") short="MOD"
      else if (attr=="OUTPUT") short="OUT"
      printf("%-30s  %-11s  R%02d C%02d %3d %-7s\n", $1, $3, $4, $5, $6, short)
    }' "$fields"
  } > "$out"
}

make_mappa_vuota() {
  fields="$1"
  out="$2"
  awk -F'|' '
    function rep(n,    s,i){s=""; for(i=1;i<=n;i++) s=s"_"; return s}
    BEGIN { for (i=1;i<=24;i++) row[i]="" }
    {
      label=$2; r=$4+0; c=$5+0; len=$6+0; attr=$7; col=$8
      mark="P"
      if (attr=="MODIFICABILE") mark="I"
      else if (attr=="OUTPUT") mark="O"
      plen=len; if (plen>24) plen=24; if (plen<4) plen=4
      part=sprintf("R%02dC%02d %-18s: [%s %s] %s", r,c,label,mark,col,rep(plen))
      if (row[r]=="") row[r]=part; else row[r]=row[r] " | " part
    }
    END {
      for (i=1;i<=24;i++) {
        txt=row[i]
        if (length(txt)>76) txt=substr(txt,1,76)
        printf("%02d|%-76s|\n", i, txt)
      }
    }
  ' "$fields" > "$out"
}

make_dizionario() {
  fields="$1"
  out="$2"
  {
    echo "NOME-CAMPO                 ORI  POS     LEN  PIC        ATTR   COL  PROT"
    echo "-------------------------  ---  ------  ---  ---------  -----  ---  ----"
    awk -F'|' '{
      attr="PROT"
      prot="SI"
      if ($7=="MODIFICABILE") { attr="MOD"; prot="NO" }
      else if ($7=="OUTPUT") { attr="OUT"; prot="SI" }
      printf("%-25s  %-3s  R%02dC%02d  %3d  %-9s  %-5s  %s    %s\n", $1,$9,$4,$5,$6,$3,attr,$8,prot)
      if ($1 ~ /^IN-ID-/) {
        db=$1; sub(/^IN-/,"DB-",db)
        printf("%-25s  DB   ----    %3d  %-9s  REF    W    SI\n", db,$6,$3)
      }
    }' "$fields"
  } > "$out"
}

make_campi_editabili() {
  fields="$1"
  modulo="$2"
  out="$3"
  : > "$out"
  awk -F'|' -v mod="$modulo" '
    {
      nome=$1; len=$6+0; attr=$7; et=$2
      key=mod "." nome
      max=len; if (max<1) max=1; if (max>80) max=80
      if (attr=="MODIFICABILE") {
        printf("<label class=\"tx2-field-wrap\">%s <input class=\"tx2-field\" data-key=\"%s\" maxlength=\"%d\" /></label>\n", et, key, max)
      } else if (attr=="OUTPUT") {
        printf("<label class=\"tx2-field-wrap\">%s <input class=\"tx2-field\" data-key=\"%s\" maxlength=\"%d\" disabled /></label>\n", et, key, max)
      }
    }
  ' "$fields" > "$out"
}

extract_top() {
  src="$1"
  out="$2"
  max="$3"
  total=$(wc -l < "$src" | tr -d ' ')
  head -n "$max" "$src" > "$out"
  if [ "$total" -gt "$max" ]; then
    echo "...(TRONCATO)" >> "$out"
  fi
}

fill_template() {
  tpl="$1"
  out="$2"
  titolo="$3"
  txstep="$4"
  msgfile="$5"
  griglia="$6"
  dettagli="$7"
  mappa="$8"
  dizio="$9"
  campiedit="${10}"
  pf6="${11}"
  nexta="${12}"
  confirma="${13}"
  pf12href="${14}"
  [ -n "$campiedit" ] || campiedit="$TMP_DIR/.empty_edit.tmp"
  [ -f "$campiedit" ] || : > "$campiedit"

  awk -v titolo="$titolo" -v txstep="$txstep" -v pf6="$pf6" -v nexta="$nexta" -v confirma="$confirma" -v pf12href="$pf12href" \
      -v msgfile="$msgfile" -v griglia="$griglia" -v dettagli="$dettagli" -v mappa="$mappa" -v dizio="$dizio" -v campiedit="$campiedit" '
    {
      line=$0
      if (index(line,"__MESSAGGIO__")>0) {
        while ((getline m < msgfile)>0) print m
        close(msgfile)
      } else if (index(line,"__GRIGLIA_CAMPI__")>0) {
        while ((getline x < griglia)>0) print x
        close(griglia)
      } else if (index(line,"__AREA_DETTAGLI__")>0) {
        while ((getline y < dettagli)>0) print y
        close(dettagli)
      } else if (index(line,"__CAMPI_EDITABILI__")>0) {
        while ((getline ce < campiedit)>0) print ce
        close(campiedit)
      } else if (index(line,"__MAPPA_VUOTA__")>0) {
        while ((getline z < mappa)>0) print z
        close(mappa)
      } else if (index(line,"__DIZIONARIO_CAMPI__")>0) {
        while ((getline w < dizio)>0) print w
        close(dizio)
      } else {
        gsub(/__TITOLO__/, titolo, line)
        gsub(/__TXSTEP__/, txstep, line)
        gsub(/__PF6_DISABLED__/, pf6, line)
        gsub(/__NEXT_ACTION__/, nexta, line)
        gsub(/__CONFIRM_ACTION__/, confirma, line)
        gsub(/__PF12_HREF__/, pf12href, line)
        print line
      }
    }
  ' "$tpl" > "$out"
}

insert_before_body_end() {
  file="$1"
  snippet="$2"
  awk -v snip="$snippet" '
    {
      if ($0 ~ /<\/body>/) {
        print snip
      }
      print
    }
  ' "$file" > "$file.tmp"
  mv "$file.tmp" "$file"
}

compile_avvio() {
  def="$DEFS_DIR/TX2-AVVIO.yml"
  [ -f "$def" ] || return

  titolo=$(get_value "$def" "titolo")
  txid_boot=$(get_value "$def" "txid_boot")
  txid_scelta=$(get_value "$def" "txid_scelta")
  msg_boot=$(get_value "$def" "messaggio_boot")
  msg_scelta=$(get_value "$def" "messaggio_scelta")

  fields="$TMP_DIR/.avvio_fields.tmp"
  det="$TMP_DIR/.avvio_det.tmp"
  msgf="$TMP_DIR/.avvio_msg.tmp"
  griglia="$TMP_DIR/.avvio_grid.tmp"
  mappa="$TMP_DIR/.avvio_map.tmp"
  dizio="$TMP_DIR/.avvio_dic.tmp"
  mapex="$TMP_DIR/.avvio_map_ex.tmp"
  dicex="$TMP_DIR/.avvio_dic_ex.tmp"
  editf="$TMP_DIR/.avvio_edit.tmp"

  parse_fields "$def" "$fields"
  parse_details "$def" "$det"
  make_griglia "$fields" "$griglia"
  make_mappa_vuota "$fields" "$mappa"
  make_dizionario "$fields" "$dizio"
  make_campi_editabili "$fields" "AVVIO" "$editf"
  extract_top "$mappa" "$mapex" 8
  extract_top "$dizio" "$dicex" 6

  make_messages "$msg_boot" "$msgf"
  {
    echo "BOOT TX2: CARICAMENTO MODULI"
    echo "BOOT TX2: VALIDAZIONE TEMPLATE"
    echo "BOOT TX2: PRONTO"
  } > "$det"

  fill_template "$TEMPLATE" "$PAGES_DIR/avvio-boot.html" \
    "$titolo" "$txid_boot" "$msgf" "$griglia" "$det" "$mapex" "$dicex" \
    "$editf" "disabled" "window.location.href='./avvio-scelta.html';" "return;" "./avvio-scelta.html"
  boot_script="<script>(function(){var righe=['BOOT TX2: ALLOCAZIONE AREA TERMINALE','BOOT TX2: AGGANCIO PF KEYS','BOOT TX2: INDIRIZZAMENTO A SCELTA'];var box=document.querySelector('.lista');var i=0;function tick(){if(!box||i>=righe.length){setTimeout(function(){window.location.href='./avvio-scelta.html';},800);return;}box.textContent += ' | ' + righe[i++];setTimeout(tick,700);}setTimeout(tick,300);})();</script>"
  insert_before_body_end "$PAGES_DIR/avvio-boot.html" "$boot_script"

  make_messages "$msg_scelta" "$msgf"
  parse_details "$def" "$det"
  fill_template "$TEMPLATE" "$PAGES_DIR/avvio-scelta.html" \
    "$titolo" "$txid_scelta" "$msgf" "$griglia" "$det" "$mapex" "$dicex" \
    "$editf" "disabled" "(function(){var k='tx2.AVVIO.IN-SCELTA-TRANSAZIONE';var v=(sessionStorage.getItem(k)||'').trim();if(v==='1'){window.location.href='./console.html';return;}if(v==='2'){fetch('../../index.html',{method:'HEAD'}).then(function(r){window.location.href=r.ok?'../../index.html':'../index.html';}).catch(function(){window.location.href='../index.html';});return;}sessionStorage.setItem('tx2.AVVIO.OUT-MSG-ESITO','SCELTA NON VALIDA');alert('Scelta non valida: usare 1 o 2.');})();" "return;" "./avvio-scelta.html"

  scelta_script="<script>(function(){var k='tx2.AVVIO.IN-SCELTA-TRANSAZIONE';var saved=sessionStorage.getItem(k)||'';var out=sessionStorage.getItem('tx2.AVVIO.OUT-MSG-ESITO')||'';if(out){var m=document.querySelector('.messaggi-pre');if(m){m.textContent='SCELTA NON VALIDA ' + out;}}document.addEventListener('keydown',function(e){if(e.key==='1'||e.key==='2'){sessionStorage.setItem(k,e.key);}});if(saved){var d=document.querySelector('.lista');if(d){d.textContent += ' ULTIMA SCELTA=' + saved;}}})();</script>"
  insert_before_body_end "$PAGES_DIR/avvio-scelta.html" "$scelta_script"
}

compile_console() {
  f="$TMP_DIR/.console_fields.tmp"
  d="$TMP_DIR/.console_det.tmp"
  msgf="$TMP_DIR/.console_msg.tmp"
  g="$TMP_DIR/.console_grid.tmp"
  m="$TMP_DIR/.console_map.tmp"
  z="$TMP_DIR/.console_dic.tmp"
  me="$TMP_DIR/.console_map_ex.tmp"
  ze="$TMP_DIR/.console_dic_ex.tmp"
  ce="$TMP_DIR/.console_edit.tmp"

  {
    echo "IN-SELEZIONE-MODULO|SELEZIONE MODULO|X(16)|6|24|16|MODIFICABILE|G|IN"
    echo "OUT-MSG-ESITO|MESSAGGIO|X(120)|3|1|72|OUTPUT|Y|OUT"
  } > "$f"

  : > "$d"
  idx=0
  for def in "$DEFS_DIR"/TX2-*.yml; do
    [ -f "$def" ] || continue
    mod=$(get_value "$def" "modulo")
    page=$(get_value "$def" "pagina_menu")
    [ -n "$mod" ] || continue
    [ -n "$page" ] || continue
    idx=$((idx+1))
    printf "[%d] %-12s -> %s\n" "$idx" "$mod" "$page" >> "$d"
  done

  make_messages "Console TX2: selezionare modulo" "$msgf"
  make_griglia "$f" "$g"
  make_mappa_vuota "$f" "$m"
  make_dizionario "$f" "$z"
  make_campi_editabili "$f" "CONSOLE" "$ce"
  extract_top "$m" "$me" 8
  extract_top "$z" "$ze" 6

  fill_template "$TEMPLATE" "$PAGES_DIR/console.html" \
    "CONSOLE TX2 CICS-LIKE" "TX2-CONSOLE" "$msgf" "$g" "$d" "$me" "$ze" \
    "$ce" "disabled" "window.location.href='./db-menu.html';" "return;" "./console.html"
}

compile_module() {
  def="$1"
  modulo=$(get_value "$def" "modulo")
  menu=$(get_value "$def" "pagina_menu")
  titolo=$(get_value "$def" "titolo")
  txid=$(get_value "$def" "txid")
  msg=$(get_value "$def" "messaggio")
  nextp=$(get_value "$def" "next")
  [ -n "$menu" ] || return

  base=$(printf '%s' "$menu" | sed 's/-menu\.html//')
  review="${base}-review.html"
  esito="${base}-esito.html"

  f="$TMP_DIR/.${base}_fields.tmp"
  d="$TMP_DIR/.${base}_det.tmp"
  msgf="$TMP_DIR/.${base}_msg.tmp"
  g="$TMP_DIR/.${base}_grid.tmp"
  m="$TMP_DIR/.${base}_map.tmp"
  z="$TMP_DIR/.${base}_dic.tmp"
  me="$TMP_DIR/.${base}_map_ex.tmp"
  ze="$TMP_DIR/.${base}_dic_ex.tmp"
  ce="$TMP_DIR/.${base}_edit.tmp"

  parse_fields "$def" "$f"
  parse_details "$def" "$d"
  make_messages "$msg" "$msgf"
  make_griglia "$f" "$g"
  make_mappa_vuota "$f" "$m"
  make_dizionario "$f" "$z"
  make_campi_editabili "$f" "$modulo" "$ce"
  extract_top "$m" "$me" 8
  extract_top "$z" "$ze" 6

  fill_template "$TEMPLATE" "$PAGES_DIR/$menu" \
    "$titolo" "$txid" "$msgf" "$g" "$d" "$me" "$ze" \
    "$ce" "disabled" "window.location.href='./$nextp';" "return;" "./console.html"

  echo "[REVIEW] PF6 o ALT+6 per conferma" > "$d"
  make_messages "Conferma transazione" "$msgf"
  fill_template "$TEMPLATE" "$PAGES_DIR/$review" \
    "$titolo" "${txid}-REVIEW" "$msgf" "$g" "$d" "$me" "$ze" \
    "$ce" "" "window.location.href='./$esito';" "sessionStorage.setItem('tx2.${modulo}.OUT-COD-ESITO','0');sessionStorage.setItem('tx2.${modulo}.OUT-MSG-ESITO','OK');window.location.href='./$esito';" "./console.html"

  {
    echo "[ESITO] TX completata"
    echo "OUT-COD-ESITO = 0"
    echo "OUT-MSG-ESITO = OK"
  } > "$d"
  make_messages "Esito transazione" "$msgf"
  fill_template "$TEMPLATE" "$PAGES_DIR/$esito" \
    "$titolo" "${txid}-ESITO" "$msgf" "$g" "$d" "$me" "$ze" \
    "$ce" "disabled" "window.location.href='./console.html';" "return;" "./console.html"
}

compile_db_er_pages() {
  awk '/"entita":"/{print}' "$ER_JSON" | sed -n 's/.*"entita":"\([^"]*\)".*"nome_cobol":"\([^"]*\)".*"pic":"\([^"]*\)".*"ruolo":"\([^"]*\)".*"fk_ref":"\([^"]*\)".*/\1|\2|\3|\4|\5/p' > "$TMP_DIR/.er_flat.tmp"
  awk '/"sorgente_entita":"/{print}' "$ER_JSON" | sed -n 's/.*"sorgente_entita":"\([^"]*\)".*"sorgente_campo":"\([^"]*\)".*"destinazione_entita":"\([^"]*\)".*"destinazione_campo":"\([^"]*\)".*/\1|\2|\3|\4/p' > "$TMP_DIR/.er_rel.tmp"

  tables=$(awk -F'|' '{print $1}' "$TMP_DIR/.er_flat.tmp" | awk '!seen[$0]++')
  : > "$TMP_DIR/.er_tables.tmp"
  for t in $tables; do echo "$t" >> "$TMP_DIR/.er_tables.tmp"; done

  per_page=4
  total=$(wc -l < "$TMP_DIR/.er_tables.tmp" | tr -d ' ')
  pages=$(( (total + per_page - 1) / per_page ))
  [ "$pages" -lt 1 ] && pages=1

  p=1
  start=1
  while [ "$p" -le "$pages" ]; do
    end=$((start + per_page - 1))
    subset="$TMP_DIR/.er_subset_${p}.tmp"
    sed -n "${start},${end}p" "$TMP_DIR/.er_tables.tmp" > "$subset"

    det="$TMP_DIR/.er_det_${p}.tmp"
    msgf="$TMP_DIR/.er_msg_${p}.tmp"
    map="$TMP_DIR/.er_map_${p}.tmp"
    dic="$TMP_DIR/.er_dic_${p}.tmp"
    grid="$TMP_DIR/.er_grid_${p}.tmp"
    mapex="$TMP_DIR/.er_mapex_${p}.tmp"
    dicex="$TMP_DIR/.er_dicex_${p}.tmp"
    ce="$TMP_DIR/.er_edit_${p}.tmp"

    make_messages "Schema E/R auto-generato da DDL" "$msgf"

    {
      echo "FORMATO AREA CAMPI (24x80)"
      echo "NOME-CAMPO                      PIC          RIGA COL  LEN ATTR"
      echo "------------------------------  -----------  ---- ---- --- -------"
      echo "IN-TIPO-OPERAZIONE              X(20)       R06 C24  20 MOD"
      echo "OUT-MSG-ESITO                   X(120)      R03 C01  72 OUT"
    } > "$grid"

    : > "$det"
    {
      echo "NOME-CAMPO                 ORI  POS     LEN  PIC        ATTR   COL  PROT"
      echo "-------------------------  ---  ------  ---  ---------  -----  ---  ----"
    } > "$dic"

    awk -F'|' '
      BEGIN { for(i=1;i<=24;i++) row[i]="" }
      NR==FNR { ord[++n]=$1; next }
      {
        if (!seen[$1]) {
          pk[$1]=0; fk[$1]=0; seen[$1]=1
        }
        if ($4=="PK") pk[$1]++
        if ($4=="FK") fk[$1]++
      }
      END {
        r=6
        for (i=1;i<=n;i++) {
          e=ord[i]
          if (r<=20) {
            row[r]=sprintf("R%02dC01 [P W] ENTITA %-18s PK:%d FK:%d", r, e, pk[e], fk[e])
            r++
          }
        }
        for (i=1;i<=24;i++) printf("%02d|%-76s|\n", i, row[i])
      }
    ' "$subset" "$TMP_DIR/.er_flat.tmp" > "$map"

    while IFS='|' read -r ent cob pic ruolo fk; do
      grep -q "^${ent}$" "$subset" || continue
      marker='[..]'; col='W'; attr='PROT'; prot='SI'
      if [ "$ruolo" = 'PK' ]; then marker='[PK]'; col='W'; attr='PROT'; prot='SI'; fi
      if [ "$ruolo" = 'FK' ]; then marker='[FK]'; col='Y'; attr='OUT'; prot='SI'; fi
      printf "%s %-28s PIC %-8s %s\n" "$marker" "$cob" "$pic" "$fk" >> "$det"
      len=$(printf '%s' "$pic" | sed -n 's/[X9](\([0-9][0-9]*\))/\1/p')
      [ -n "$len" ] || len=0
      printf "%-25s  DB   ----    %3s  %-9s  %-5s  %s    %s\n" "$cob" "$len" "$pic" "$attr" "$col" "$prot" >> "$dic"
    done < "$TMP_DIR/.er_flat.tmp"

    echo "-- RELAZIONI --" >> "$det"
    while IFS='|' read -r s sc d dc; do
      if grep -q "^${s}$" "$subset" || grep -q "^${d}$" "$subset"; then
        printf "%s(%s) <- %s(%s)\n" "$d" "$dc" "$s" "$sc" >> "$det"
        printf "RELAZIONE %-15s  DB   ----     -  %-9s  REF    W    SI\n" "$s->$d" "$sc/$dc" >> "$dic"
      fi
    done < "$TMP_DIR/.er_rel.tmp"

    extract_top "$map" "$mapex" 8
    extract_top "$dic" "$dicex" 6
    : > "$ce"

    page_name="db-er.html"
    [ "$p" -gt 1 ] && page_name=$(printf 'db-er-%02d.html' "$p")

    next_nav="window.location.href='./db-menu.html';"
    if [ "$p" -lt "$pages" ]; then
      nextfile=$(printf 'db-er-%02d.html' $((p+1)))
      [ "$p" -eq 1 ] && nextfile='db-er-02.html'
      next_nav="window.location.href='./${nextfile}';"
    fi

    fill_template "$TEMPLATE" "$PAGES_DIR/$page_name" \
      "MODULO DATABASE" "TX2-DB-ER-$(printf '%02d' "$p")" "$msgf" \
      "$grid" "$det" "$mapex" "$dicex" \
      "$ce" "disabled" "$next_nav" "return;" "./console.html"

    p=$((p+1))
    start=$((start + per_page))
  done
}

compile_avvio
compile_console
for def in "$DEFS_DIR"/TX2-*.yml; do
  [ -f "$def" ] || continue
  mod=$(get_value "$def" "modulo")
  [ "$mod" = "AVVIO" ] && continue
  compile_module "$def"
done
compile_db_er_pages

echo "Mappe compilate in $PAGES_DIR"
