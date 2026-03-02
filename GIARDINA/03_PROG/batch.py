from __future__ import annotations

import argparse

from builder import build_site
from copy_compiler import compile_all
from ingest import ingest
from validator import validate_records


def cmd_compile() -> int:
    generated = compile_all()
    print(f"OK|COMPILE_COPY|SCHEMAS={len(generated)}")
    return 0


def cmd_validate() -> int:
    result = validate_records()
    print(f"JOB|VALIDATE|RC={result.rc}|ERRORS={len(result.errors)}|WARNINGS={len(result.warnings)}")
    for err in result.errors:
        print(f"ERR|{err}")
    for wrn in result.warnings:
        print(f"WRN|{wrn}")
    return result.rc


def cmd_build() -> int:
    result = build_site()
    print(f"JOB|BUILD|RC={result.rc}|ERRORS={len(result.errors)}|WARNINGS={len(result.warnings)}")
    for err in result.errors:
        print(f"ERR|{err}")
    for wrn in result.warnings:
        print(f"WRN|{wrn}")
    return result.rc


def cmd_ingest(record_id: str, with_hash: bool = False) -> int:
    result = ingest(record_id, with_hash=with_hash)
    print(f"JOB|INGEST|RC={result.rc}|ERRORS={len(result.errors)}|WARNINGS={len(result.warnings)}")
    for err in result.errors:
        print(f"ERR|{err}")
    return result.rc


def main() -> int:
    parser = argparse.ArgumentParser(description="GIARDINA batch controller")
    sub = parser.add_subparsers(dest="job", required=True)

    sub.add_parser("compile-copy")
    sub.add_parser("validate")
    sub.add_parser("build")
    ingest_parser = sub.add_parser("ingest")
    ingest_parser.add_argument("--record-id", required=True)
    ingest_parser.add_argument("--with-hash", action="store_true", default=False)
    sub.add_parser("all")

    args = parser.parse_args()
    if args.job == "compile-copy":
        return cmd_compile()
    if args.job == "validate":
        return cmd_validate()
    if args.job == "build":
        return cmd_build()
    if args.job == "ingest":
        return cmd_ingest(args.record_id, with_hash=args.with_hash)
    if args.job == "all":
        rc1 = cmd_compile()
        rc2 = cmd_validate()
        if rc2 >= 8:
            return rc2
        rc3 = cmd_build()
        return max(rc1, rc2, rc3)
    return 8


if __name__ == "__main__":
    raise SystemExit(main())
