#!/usr/bin/env python3
"""
GN370 multi-platform build orchestrator.
Runs deterministic SQLite init + baseline checks and emits per-target artifacts.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def run(cmd: list[str]) -> None:
    print("[RUN]", " ".join(cmd))
    subprocess.run(cmd, cwd=ROOT, check=True)


def emit_target_artifact(target: str) -> None:
    out_dir = ROOT / "out" / "build" / target
    out_dir.mkdir(parents=True, exist_ok=True)
    info = "\n".join(
        [
            f"GN370 build target: {target}",
            "pipeline: build-all.py",
            "sqlite: out/runtime/gn370.sqlite",
            "todo:",
            "- compile native core via CMake/toolchain",
            "- package UI shell and assets",
            "- produce target installer/bundle",
            "",
        ]
    )
    (out_dir / "BUILD_INFO.txt").write_text(info, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="GN370 multi-platform build orchestrator")
    parser.add_argument(
        "--target",
        choices=["all", "windows", "macos", "linux", "android"],
        default="all",
        help="Target platform",
    )
    args = parser.parse_args()

    run(["node", "scripts/vendorize-sqlite-wasm.js"])
    run([sys.executable, "scripts/recreate_sqlite.py", "--schema", "db/schema.sql", "--db", "out/runtime/gn370.sqlite"])
    run(["node", "tests/gate_tests.js"])
    run(["node", "tests/validation_tests.js"])

    targets = ["windows", "macos", "linux", "android"] if args.target == "all" else [args.target]
    for t in targets:
        emit_target_artifact(t)

    print("[GN370] done. artifacts in out/build/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
