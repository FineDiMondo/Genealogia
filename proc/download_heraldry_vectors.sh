#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AR_DIR="$ROOT_DIR/data/araldica"
STEMMI_DAT="$AR_DIR/STEMMI.DAT"
VECTOR_SRC_DAT="$AR_DIR/STEMMI_VECTOR_SOURCES.DAT"
ASSET_DIR="$ROOT_DIR/PORTALE_GN/assets/heraldry"
LOG_DIR="$ROOT_DIR/logs"
LOG_FILE="$LOG_DIR/heraldry_download.log"

mkdir -p "$ASSET_DIR" "$LOG_DIR"

if [[ ! -f "$STEMMI_DAT" ]]; then
  echo "ERRORE: file non trovato: $STEMMI_DAT"
  exit 1
fi

if [[ ! -f "$VECTOR_SRC_DAT" ]]; then
  {
    echo "# STEMMI_VECTOR_SOURCES.DAT"
    echo "# STEMMA_ID|SVG_URL|FILE_NAME|ENABLED|NOTE"
    awk -F'|' '
      BEGIN { OFS="|" }
      /^#/ || NF==0 { next }
      {
        stemma=$1
        old=$6
        gsub(/^.*\//, "", old)
        sub(/\.[^.]+$/, "", old)
        if (old == "") old=tolower(stemma)
        print stemma, "", old ".svg", "N", "SET_URL_AND_ENABLE_Y"
      }
    ' "$STEMMI_DAT"
  } > "$VECTOR_SRC_DAT"
  echo "INFO: creato template $VECTOR_SRC_DAT"
  echo "INFO: compila URL pubbliche SVG e imposta ENABLED=Y."
  exit 0
fi

tmp_dat="$(mktemp "$AR_DIR/STEMMI.DAT.XXXXXX.tmp")"
cp "$STEMMI_DAT" "$tmp_dat"

echo "# heraldry vector download $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$LOG_FILE"

downloaded=0
failed=0
skipped=0

while IFS='|' read -r stemma_id svg_url file_name enabled note; do
  [[ -z "${stemma_id:-}" ]] && continue
  [[ "$stemma_id" =~ ^# ]] && continue

  enabled="${enabled:-N}"
  if [[ "${enabled^^}" != "Y" ]]; then
    skipped=$((skipped + 1))
    echo "SKIP|$stemma_id|DISABLED" >> "$LOG_FILE"
    continue
  fi

  if [[ -z "${svg_url:-}" || -z "${file_name:-}" ]]; then
    failed=$((failed + 1))
    echo "FAIL|$stemma_id|MISSING_URL_OR_FILENAME" >> "$LOG_FILE"
    continue
  fi

  # Accept Wikimedia "File:" page URLs by converting to raw file endpoint.
  if [[ "$svg_url" =~ ^https://commons\.wikimedia\.org/wiki/File: ]]; then
    file_page="${svg_url#https://commons.wikimedia.org/wiki/}"
    svg_url="https://commons.wikimedia.org/wiki/Special:FilePath/${file_page}"
  fi

  if [[ ! "$file_name" =~ \.svg$ ]]; then
    file_name="${file_name}.svg"
  fi

  out_file="$ASSET_DIR/$file_name"
  tmp_svg="$(mktemp "$ASSET_DIR/${stemma_id}.XXXXXX.download")"

  if ! curl -fsSL "$svg_url" -o "$tmp_svg"; then
    failed=$((failed + 1))
    echo "FAIL|$stemma_id|DOWNLOAD_ERROR|$svg_url" >> "$LOG_FILE"
    rm -f "$tmp_svg"
    continue
  fi

  if ! grep -qi "<svg" "$tmp_svg"; then
    failed=$((failed + 1))
    echo "FAIL|$stemma_id|NOT_SVG_CONTENT|$svg_url" >> "$LOG_FILE"
    rm -f "$tmp_svg"
    continue
  fi

  mv "$tmp_svg" "$out_file"
  rel_path="assets/heraldry/$file_name"

  awk -F'|' -v OFS='|' -v sid="$stemma_id" -v img="$rel_path" '
    /^#/ || NF==0 { print; next }
    $1 == sid { $6 = img }
    { print }
  ' "$tmp_dat" > "${tmp_dat}.next"
  mv "${tmp_dat}.next" "$tmp_dat"

  downloaded=$((downloaded + 1))
  echo "OK|$stemma_id|$rel_path|$svg_url" >> "$LOG_FILE"
done < "$VECTOR_SRC_DAT"

mv "$tmp_dat" "$STEMMI_DAT"

echo "SUMMARY|DOWNLOADED=$downloaded|FAILED=$failed|SKIPPED=$skipped" >> "$LOG_FILE"
echo "DOWNLOAD_VECTORS|DOWNLOADED=$downloaded|FAILED=$failed|SKIPPED=$skipped"
