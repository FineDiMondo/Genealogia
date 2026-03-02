#!/bin/bash
set -euo pipefail

mkdir -p test-fixtures/build/tables
cat > test-fixtures/build/tables/PERSON.table <<'"'"'EOF'"'"'
##TABLE=PERSON|SCHEMA=2.0|COLS=0|CREATED=202603021200
{"person_id":"GNP000000001","surname":"Giardina","given_name":"Pietro","gender":"M","birth_date":"1500"}
##CHECKSUM=SHA256:stub|ROWS=1
EOF

cat > test-fixtures/build/tables/EVENT.table <<'"'"'EOF'"'"'
##TABLE=EVENT|SCHEMA=2.0|COLS=0|CREATED=202603021200
{"event_id":"GNE000000001","person_id":"GNP000000001","event_type":"BIRTH","event_date":"1500"}
##CHECKSUM=SHA256:stub|ROWS=1
EOF

(cd test-fixtures/build && zip -qr ../sample-db.zip tables)
rm -rf test-fixtures/build

echo "[OK] fixture sample-db.zip generated"
