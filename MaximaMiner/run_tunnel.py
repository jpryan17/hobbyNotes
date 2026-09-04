import os
import sys
import time
import re
import subprocess
import urllib.request
import webbrowser
from pathlib import Path

# Ensure UTF-8 output in Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CLOUDFLARED_EXE = PROJECT_ROOT / "MaximaMiner" / "bin" / "cloudflared.exe"
SERVER_SCRIPT = PROJECT_ROOT / "MaximaMiner" / "server.py"

def is_server_running(port=8000):
    try:
        req = urllib.request.Request(f"http://127.0.0.1:{port}/api/health")
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            return resp.status == 200
    except Exception:
        return False

def copy_to_clipboard(text):
    if sys.platform == "win32":
        try:
            subprocess.run(
                ["powershell", "-NoProfile", "-Command", f"Set-Clipboard -Value '{text}'"],
                check=False,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)
            )
        except Exception:
            pass

def main():
    print("\n============================================================")
    print("      MaxCalc Live Public Tunnel Launcher (Cloudflare)     ")
    print("============================================================\n")

    if not CLOUDFLARED_EXE.exists():
        print(f"[-] Error: cloudflared binary not found at: {CLOUDFLARED_EXE}")
        print("    Please ensure cloudflared.exe is downloaded.")
        input("\nPress Enter to exit...")
        return 1

    server_proc = None
    if not is_server_running(8000):
        print("[*] Starting local MaxCalc backend server on port 8000...")
        server_proc = subprocess.Popen(
            [sys.executable, str(SERVER_SCRIPT), "8000"],
            cwd=str(PROJECT_ROOT)
        )
        time.sleep(2)
        if not is_server_running(8000):
            print("[-] Warning: Server did not respond immediately, continuing anyway...")
    else:
        print("[+] MaxCalc backend server is already running on port 8000.")

    print("[*] Establishing secure Cloudflare tunnel to localhost:8000...")
    tunnel_proc = subprocess.Popen(
        [str(CLOUDFLARED_EXE), "tunnel", "--url", "http://localhost:8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1
    )

    url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")
    public_url = None

    # Read output until tunnel URL is found
    for line in iter(tunnel_proc.stdout.readline, ""):
        match = url_pattern.search(line)
        if match:
            public_url = match.group(0)
            break

    if not public_url:
        print("[-] Could not retrieve public tunnel URL from cloudflared.")
        if tunnel_proc.poll() is not None:
            print(f"    cloudflared exited with code {tunnel_proc.returncode}.")
        tunnel_proc.terminate()
        if server_proc:
            server_proc.terminate()
        input("\nPress Enter to exit...")
        return 1

    copy_to_clipboard(public_url)

    print("\n" + "=" * 60)
    print("  SUCCESS: Your Live MaxCalc Public Tunnel is ACTIVE!")
    print("=" * 60)
    print(f"\n  Public URL:  {public_url}")
    print("  (URL has been automatically copied to your clipboard!)")
    print("\n  Anyone with this link can now run live Maxima calculations")
    print("  and explore Common Lisp execution traces on your engine.")
    print("=" * 60)
    print("\n[+] Opening public URL in your default browser...")
    try:
        webbrowser.open(public_url)
    except Exception:
        pass

    print("\n[*] Tunnel is running live. Press [Enter] or [Ctrl+C] to stop and disconnect.\n")

    try:
        input()
    except (KeyboardInterrupt, EOFError):
        pass
    finally:
        print("\n[*] Shutting down secure tunnel...")
        tunnel_proc.terminate()
        try:
            tunnel_proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            tunnel_proc.kill()

        if server_proc:
            print("[*] Stopping local server process...")
            server_proc.terminate()
            try:
                server_proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                server_proc.kill()

        print("[+] Tunnel closed. Your PC is private again.\n")

    return 0

if __name__ == "__main__":
    sys.exit(main())
