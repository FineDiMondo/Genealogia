#!/usr/bin/env python3
"""
Static server with COOP/COEP headers for SQLite OPFS support.
"""

from __future__ import annotations

import argparse
import errno
import http.server
import json
import socketserver
from pathlib import Path
from urllib.parse import urlsplit


class IsolationHandler(http.server.SimpleHTTPRequestHandler):
    def _send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _handle_salvataggi_list(self) -> None:
        root_dir = Path(self.directory or ".").resolve()
        salvataggi = root_dir / "salvataggi"
        salvataggi.mkdir(parents=True, exist_ok=True)
        files = sorted(
            p.name
            for p in salvataggi.iterdir()
            if p.is_file() and p.suffix.lower() == ".zip"
        )
        self._send_json({
            "folder": "salvataggi",
            "count": len(files),
            "files": files,
        })

    def do_GET(self) -> None:
        path = urlsplit(self.path).path
        if path == "/api/salvataggi":
            self._handle_salvataggi_list()
            return
        super().do_GET()

    def end_headers(self) -> None:
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def bind_http_server(handler, start_port: int, auto_port: bool, max_tries: int) -> tuple[socketserver.TCPServer, int]:
    attempts = max(1, max_tries if auto_port else 1)
    recoverable_errnos = {errno.EADDRINUSE, errno.EACCES}
    recoverable_winerrors = {10048, 10013}
    for offset in range(attempts):
        port = start_port + offset
        try:
            return ReusableTCPServer(("", port), handler), port
        except OSError as exc:
            is_recoverable = (
                exc.errno in recoverable_errnos
                or getattr(exc, "winerror", None) in recoverable_winerrors
            )
            if not auto_port or not is_recoverable:
                raise
    raise OSError(
        errno.EADDRINUSE,
        f"No free port found in range {start_port}-{start_port + attempts - 1}",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Serve GN370 static files with COOP/COEP headers")
    parser.add_argument("--port", type=int, default=8080, help="Port to bind")
    parser.add_argument(
        "--auto-port",
        action="store_true",
        help="If requested port is busy, try next ports until one is free",
    )
    parser.add_argument(
        "--max-port-tries",
        type=int,
        default=20,
        help="Maximum ports to try when --auto-port is enabled",
    )
    parser.add_argument("--root", default=".", help="Root directory to serve")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    handler = lambda *h_args, **h_kwargs: IsolationHandler(*h_args, directory=str(root), **h_kwargs)

    httpd, bound_port = bind_http_server(
        handler,
        start_port=args.port,
        auto_port=bool(args.auto_port),
        max_tries=args.max_port_tries,
    )
    if bound_port != args.port:
        print(f"[GN370] port {args.port} busy, fallback to {bound_port}")

    with httpd:
        print(f"[GN370] serving {root} on http://localhost:{bound_port} with COOP/COEP")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
