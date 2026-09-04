import os
import sys
import json
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import urllib.parse

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from MaximaMiner.core.tracer import MaximaMinerEngine

WEB_DIR = Path(__file__).resolve().parent / "web"

class MaxCalcHandler(SimpleHTTPRequestHandler):
    engine = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "app": "MaxCalc"}).encode("utf-8"))
            return

        # Default static file handling
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/calc":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                payload = json.loads(body)

                expression = payload.get("expression", "").strip()
                variable = payload.get("variable", "x").strip() or "x"
                operation = payload.get("operation", "integrate")

                if not expression:
                    self._send_json({"success": False, "error": "Expression cannot be empty."}, status=400)
                    return

                # Ensure engine is initialized
                if MaxCalcHandler.engine is None:
                    MaxCalcHandler.engine = MaximaMinerEngine()

                report = MaxCalcHandler.engine.mine_integral(integrand=expression, var=variable)

                self._send_json({
                    "success": True,
                    "data": report
                })

            except Exception as e:
                self._send_json({
                    "success": False,
                    "error": str(e)
                }, status=500)
            return

        self.send_error(404, "Endpoint not found")

    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _send_json(self, data: dict, status: int = 200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))


def run_server(port: int = 8000):
    if not WEB_DIR.exists():
        WEB_DIR.mkdir(parents=True, exist_ok=True)

    server_address = ("127.0.0.1", port)
    try:
        httpd = ThreadingHTTPServer(server_address, MaxCalcHandler)
    except OSError as e:
        # If port is in use, try port + 1
        alt_port = port + 1
        print(f"[MaxCalc Server] Port {port} occupied, trying {alt_port}...")
        server_address = ("127.0.0.1", alt_port)
        httpd = ThreadingHTTPServer(server_address, MaxCalcHandler)
        port = alt_port

    print(f"\n=======================================================")
    print(f"  [ MaxCalc Server ] Running at http://127.0.0.1:{port}")
    print(f"  Web Interface : http://127.0.0.1:{port}/")
    print(f"  API Endpoint  : http://127.0.0.1:{port}/api/calc")
    print(f"=======================================================\n")
    print("Press Ctrl+C to stop the server.")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[MaxCalc Server] Stopping server gracefully...")
        httpd.server_close()


if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
