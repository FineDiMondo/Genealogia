#!/usr/bin/env python3
"""
Smoke check for GitHub Pages base path usage.

Flags links/scripts/actions that:
- start with "/" but not "/Genealogia/"
- start with "https://finedimondo.github.io/" but not ".../Genealogia/"
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

RE_ATTR = re.compile(r"""(?:href|src|action)\s*=\s*["']([^"']+)["']""", re.IGNORECASE)
RE_JS = re.compile(
    r"""(?:fetch\(\s*["']([^"']+)["']|location\.href\s*=\s*["']([^"']+)["'])""",
    re.IGNORECASE,
)

BAD_PREFIX = "https://finedimondo.github.io/"
GOOD_PREFIX = "https://finedimondo.github.io/Genealogia/"


def is_bad_url(url: str) -> bool:
    u = url.strip()
    if not u or u.startswith("#"):
        return False
    if u.startswith(BAD_PREFIX) and not u.startswith(GOOD_PREFIX):
        return True
    if u.startswith("/") and not u.startswith("/Genealogia/"):
        return True
    return False


def scan_file(path: Path) -> list[tuple[int, str]]:
    issues: list[tuple[int, str]] = []
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()

    for idx, line in enumerate(lines, start=1):
        for m in RE_ATTR.finditer(line):
            url = m.group(1)
            if is_bad_url(url):
                issues.append((idx, url))
        for m in RE_JS.finditer(line):
            url = m.group(1) or m.group(2)
            if url and is_bad_url(url):
                issues.append((idx, url))
    return issues


def discover_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for base in [root / "mvs", root / "PORTALE_GN", root / "out" / "current" / "site"]:
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if p.suffix.lower() in {".html", ".js"} and p.is_file():
                files.append(p)
    return files


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    files = discover_files(root)
    if not files:
        print("WARN: no html/js files found in mvs/, PORTALE_GN/ or out/current/site/")
        return 1

    bad = []
    for f in files:
        issues = scan_file(f)
        for line_no, url in issues:
            bad.append((f, line_no, url))

    if bad:
        print("BAD LINKS FOUND:")
        for f, line_no, url in bad:
            rel = f.relative_to(root)
            print(f"- {rel}:{line_no} -> {url}")
        return 1

    print("OK: no bad absolute links detected outside /Genealogia/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
