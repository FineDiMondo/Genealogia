RootsMagic Adapter (GEDCOM-first)

Scope:
- Official bridge from FamilySearch via RootsMagic TreeShare
- Import source is GEDCOM exported from RootsMagic
- No scraping, no reverse-engineering of private APIs

Usage:
1) In RootsMagic, complete TreeShare sync and export GEDCOM
2) Save GEDCOM to:
   data\in\rootsmagic.ged
   or run:
   tools\rootsmagic\rm_import.cmd "C:\path\file.ged"

Output generated:
- data/current/entities/persons.ndjson
- data/current/entities/families.ndjson
- data/current/entities/sources.ndjson
- data/current/indexes/person_name.idx
- data/current/indexes/person_fs_id.idx
- data/current/events.ndjson
- data/current/meta/last_import.json
- data/current/meta/snapshot_hashes.json

Exit codes:
- 0 OK
- 1 WARN
- 2 INPUT ERROR
- 3 SYSTEM ERROR

Notes:
- Parser supports conservative GEDCOM subset (INDI/FAM/SOUR)
- Unknown tags are ignored safely
- Incremental journal based on content hash diff
