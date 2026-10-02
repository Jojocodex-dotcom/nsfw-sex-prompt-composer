#!/usr/bin/env python3
"""Tiny CORS proxy: browser → this → ComfyUI.

Usage:
  python3 tools/comfy_cors_proxy.py
  # listens http://127.0.0.1:8190  →  http://127.0.0.1:8188

Then set workbench ComfyUI Base URL to http://127.0.0.1:8190

Prefer ComfyUI flag when possible:
  python main.py --enable-cors-header
"""
from __future__ import annotations

import argparse
import http.client
import http.server
import sys
from urllib.parse import urlparse


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--listen", default="127.0.0.1:8190")
    ap.add_argument("--upstream", default="http://127.0.0.1:8188")
    args = ap.parse_args()
    host, port_s = args.listen.rsplit(":", 1)
    port = int(port_s)
    up = urlparse(args.upstream)
    up_host = up.hostname or "127.0.0.1"
    up_port = up.port or (443 if up.scheme == "https" else 80)

    class Handler(http.server.BaseHTTPRequestHandler):
        def _cors(self) -> None:
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "*")
            self.send_header("Access-Control-Expose-Headers", "*")

        def do_OPTIONS(self) -> None:  # noqa: N802
            self.send_response(204)
            self._cors()
            self.end_headers()

        def _proxy(self) -> None:
            length = int(self.headers.get("Content-Length") or 0)
            body = self.rfile.read(length) if length else None
            conn = http.client.HTTPConnection(up_host, up_port, timeout=600)
            headers = {k: v for k, v in self.headers.items() if k.lower() not in ("host", "content-length")}
            path = self.path
            try:
                conn.request(self.command, path, body=body, headers=headers)
                resp = conn.getresponse()
                data = resp.read()
                self.send_response(resp.status)
                self._cors()
                for k, v in resp.getheaders():
                    lk = k.lower()
                    if lk in ("transfer-encoding", "connection", "content-encoding"):
                        continue
                    if lk.startswith("access-control-"):
                        continue
                    self.send_header(k, v)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:  # noqa: BLE001
                msg = str(e).encode()
                self.send_response(502)
                self._cors()
                self.send_header("Content-Type", "text/plain; charset=utf-8")
                self.send_header("Content-Length", str(len(msg)))
                self.end_headers()
                self.wfile.write(msg)
            finally:
                conn.close()

        do_GET = _proxy  # noqa: N815
        do_POST = _proxy  # noqa: N815
        do_PUT = _proxy  # noqa: N815
        do_DELETE = _proxy  # noqa: N815

        def log_message(self, fmt: str, *a) -> None:
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % a))

    httpd = http.server.ThreadingHTTPServer((host, port), Handler)
    print(f"Comfy CORS proxy http://{host}:{port} → {args.upstream}", flush=True)
    httpd.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
