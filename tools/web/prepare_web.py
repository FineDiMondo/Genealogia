#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path


def to_relative(path: str) -> str:
    if path.startswith("//"):
        return path
    if path.startswith("/"):
        return "./" + path.lstrip("/")
    return path


def rewrite_text(content: str) -> str:
    # href/src/action with absolute-root URLs.
    content = re.sub(
        r'(?P<a>\b(?:href|src|action)\s*=\s*["\'])(?P<u>/[^"\']*)',
        lambda m: f"{m.group('a')}{to_relative(m.group('u'))}",
        content,
        flags=re.IGNORECASE,
    )
    # fetch('/...') or fetch("/...")
    content = re.sub(
        r'fetch\(\s*([\'"])(/[^\'"]*)\1',
        lambda m: f"fetch({m.group(1)}{to_relative(m.group(2))}{m.group(1)}",
        content,
    )
    # location.href='/...'
    content = re.sub(
        r'(location\.href\s*=\s*)([\'"])(/[^\'"]*)([\'"])',
        lambda m: f"{m.group(1)}{m.group(2)}{to_relative(m.group(3))}{m.group(4)}",
        content,
    )
    return content


def process_file(path: Path) -> None:
    raw = path.read_text(encoding="utf-8", errors="ignore")
    rewritten = rewrite_text(raw)
    if rewritten != raw:
        path.write_text(rewritten, encoding="utf-8")


def ensure_portale_link(web_root: Path) -> None:
    portale_index = web_root / "PORTALE_GN" / "index.html"
    if not portale_index.exists():
        return
    raw = portale_index.read_text(encoding="utf-8", errors="ignore")
    if "Avvia Emulatore" in raw:
        return
    inject = '<p><a href="../index.html">Avvia Emulatore</a></p>'
    if "</body>" in raw:
        raw = raw.replace("</body>", f"{inject}\n</body>", 1)
    else:
        raw += "\n" + inject + "\n"
    portale_index.write_text(raw, encoding="utf-8")


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: prepare_web.py <web_root>")
        return 2
    web_root = Path(sys.argv[1]).resolve()
    if not web_root.exists():
        print(f"web root not found: {web_root}")
        return 2

    for ext in (".html", ".js", ".css"):
        for file in web_root.rglob(f"*{ext}"):
            process_file(file)

    ensure_portale_link(web_root)
    print(f"[OK] rewritten paths under {web_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
