#!/usr/bin/env sh
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TX2_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

sh "$TX2_DIR/jobs/TX2-DB.jcl.sh"
sh "$TX2_DIR/jobs/TX2-GEDCOM.jcl.sh"
sh "$TX2_DIR/jobs/TX2-LLM.jcl.sh"
sh "$TX2_DIR/jobs/TX2-FAM.jcl.sh"
sh "$TX2_DIR/jobs/TX2-PER.jcl.sh"

echo "TX2-ALL COMPLETATO"
