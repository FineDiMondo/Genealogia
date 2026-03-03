#!/usr/bin/env python3
"""
Create (or recreate) GN370 embedded SQLite database from schema.sql.
Deterministic by design: existing DB file is removed before initialization.
"""

import argparse
import json
import os
import sqlite3
import sys
from pathlib import Path


def table_count(conn: sqlite3.Connection) -> int:
    cur = conn.execute(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    return int(cur.fetchone()[0])


def recreate(schema_path: Path, db_path: Path, seed_json: Path | None = None) -> dict:
    if not schema_path.exists():
        raise FileNotFoundError(f"Schema not found: {schema_path}")

    db_path.parent.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db_path.unlink()

    conn = sqlite3.connect(str(db_path))
    try:
        schema_sql = schema_path.read_text(encoding="utf-8")
        conn.executescript(schema_sql)

        if seed_json and seed_json.exists():
            payload = json.loads(seed_json.read_text(encoding="utf-8"))
            for row in payload.get("import_audit", []):
                conn.execute(
                    """
                    INSERT OR REPLACE INTO GN370_IMPORT_AUDIT(import_id, source_label, imported_at, records_total)
                    VALUES(?,?,?,?)
                    """,
                    (
                        str(row.get("import_id", "")),
                        str(row.get("source_label", "seed")),
                        str(row.get("imported_at", "")),
                        int(row.get("records_total", 0)),
                    ),
                )

        conn.commit()
        return {
            "db_path": str(db_path),
            "schema_path": str(schema_path),
            "table_count": table_count(conn),
            "size_bytes": os.path.getsize(db_path),
        }
    finally:
        conn.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Recreate GN370 SQLite database from schema.sql")
    parser.add_argument("--schema", default="db/schema.sql", help="Path to schema.sql")
    parser.add_argument("--db", default="out/runtime/gn370.sqlite", help="Output SQLite DB path")
    parser.add_argument("--seed", default="", help="Optional JSON seed file")
    args = parser.parse_args()

    schema_path = Path(args.schema).resolve()
    db_path = Path(args.db).resolve()
    seed_path = Path(args.seed).resolve() if args.seed else None

    try:
        result = recreate(schema_path, db_path, seed_path)
        print(json.dumps(result, indent=2))
        return 0
    except Exception as exc:  # noqa: BLE001 - explicit CLI error path
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
