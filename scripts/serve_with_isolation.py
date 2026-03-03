#!/usr/bin/env python3
"""
Static server with COOP/COEP headers for SQLite OPFS support.
"""

from __future__ import annotations

import argparse
import http.server
import socketserver
from pathlib import Path


class IsolationHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()


def main() -> int:
    parser = argparse.ArgumentParser(description="Serve GN370 static files with COOP/COEP headers")
    parser.add_argument("--port", type=int, default=8080, help="Port to bind")
    parser.add_argument("--root", default=".", help="Root directory to serve")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    handler = lambda *h_args, **h_kwargs: IsolationHandler(*h_args, directory=str(root), **h_kwargs)

    with socketserver.TCPServer(("", args.port), handler) as httpd:
        print(f"[GN370] serving {root} on http://localhost:{args.port} with COOP/COEP")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
