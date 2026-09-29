import base64
import json
import mimetypes
import os
import re
import shutil
import subprocess
import threading
import webbrowser
from datetime import datetime, timezone
from email.parser import BytesParser
from email.policy import default as email_policy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
PHOTOS = ROOT / "photos"
TRASH = PHOTOS / ".trash"
ALLOWED = {".jpg", ".jpeg", ".png", ".webp"}
MAX_REQUEST = 250 * 1024 * 1024

def setup():
    PHOTOS.mkdir(exist_ok=True); TRASH.mkdir(exist_ok=True)

def safe_name(value, ignore=None):
    suffix = Path(value).suffix.lower()
    if suffix not in ALLOWED: return None
    stem = Path(value).stem.lower()
    stem = re.sub(r"[^a-z0-9]+", "-", stem.encode("ascii", "ignore").decode()).strip("-")[:70] or "photo"
    candidate, number = stem + suffix, 2
    while candidate != ignore and (PHOTOS / candidate).exists():
        candidate = f"{stem}-{number}{suffix}"; number += 1
    return candidate

def photo_list():
    images = []
    for item in PHOTOS.iterdir():
        if item.is_file() and item.suffix.lower() in ALLOWED:
            stat = item.stat(); images.append({"name": item.name, "size": stat.st_size, "modified": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(), "url": "/api/photo/" + item.name})
    return sorted(images, key=lambda x: x["modified"], reverse=True)

def build_gallery():
    executable = "npm.cmd" if os.name == "nt" else "npm"
    result = subprocess.run([executable, "run", "build:gallery"], cwd=ROOT, capture_output=True, text=True)
    if result.returncode: raise RuntimeError(result.stderr or result.stdout or "Nie udało się odświeżyć galerii.")

class Handler(BaseHTTPRequestHandler):
    server_version = "GalleryManager/1.0"
    def log_message(self, *_): pass
    def reply(self, data, status=200):
        content = json.dumps(data, ensure_ascii=False).encode(); self.send_response(status); self.send_header("Content-Type", "application/json; charset=utf-8"); self.send_header("Content-Length", len(content)); self.end_headers(); self.wfile.write(content)
    def body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length > MAX_REQUEST: raise ValueError("Przesłane pliki są zbyt duże.")
        return json.loads(self.rfile.read(length))
    def upload_items(self):
        length = int(self.headers.get("Content-Length", 0))
        if length > MAX_REQUEST: raise ValueError("Przesłane pliki są zbyt duże.")
        content_type = self.headers.get("Content-Type", "")
        payload = self.rfile.read(length)
        if content_type.startswith("multipart/form-data"):
            message = BytesParser(policy=email_policy).parsebytes(
                f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode() + payload
            )
            if not message.is_multipart(): raise ValueError("Nieprawidłowe dane przesłanych plików.")
            for part in message.iter_parts():
                name = part.get_filename()
                if part.get_content_disposition() == "form-data" and name:
                    yield name, part.get_payload(decode=True) or b""
            return
        for item in json.loads(payload).get("files", []):
            yield item.get("name", ""), base64.b64decode(item.get("data", ""), validate=True)
    def static(self, root, relative, fallback=None):
        relative = unquote(relative).lstrip("/") or (fallback or "")
        target = (root / relative).resolve()
        if root.resolve() not in target.parents and target != root.resolve(): return self.send_error(403)
        if not target.is_file(): return self.send_error(404)
        data = target.read_bytes(); self.send_response(200); self.send_header("Content-Type", mimetypes.guess_type(target.name)[0] or "application/octet-stream"); self.send_header("Content-Length", len(data)); self.end_headers(); self.wfile.write(data)
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/state": return self.reply({"photos": photo_list()})
        if path.startswith("/api/photo/"):
            name = Path(unquote(path[len("/api/photo/"):])).name
            return self.static(PHOTOS, name)
        if path.startswith("/preview"):
            return self.static(ROOT, path[len("/preview/"):], "index.html")
        if path == "/" or path == "/index.html": return self.static(ROOT / "manager_python", "index.html")
        if path.startswith("/assets/"): return self.static(ROOT / "manager_python", path[1:])
        self.send_error(404)
    def do_POST(self):
        if self.path == "/api/shutdown":
            self.reply({"ok": True}); threading.Timer(.3, self.server.shutdown).start(); return
        if self.path != "/api/upload": return self.send_error(404)
        try:
            added, rejected = [], []
            for original_name, raw in self.upload_items():
                name = safe_name(original_name)
                if not name: rejected.append(original_name or "nieznany plik"); continue
                (PHOTOS / name).write_bytes(raw); added.append(name)
            if added: build_gallery()
            self.reply({"added": added, "rejected": rejected}, 201 if added else 400)
        except (ValueError, KeyError, base64.binascii.Error, RuntimeError) as error: self.reply({"error": str(error)}, 400)
    def do_PATCH(self):
        if not self.path.startswith("/api/photo/"): return self.send_error(404)
        name = Path(unquote(self.path[len("/api/photo/"):])).name; source = PHOTOS / name
        if not source.is_file(): return self.send_error(404)
        try:
            requested = self.body().get("name", "").strip()
            if not requested: raise ValueError("Podaj nową nazwę zdjęcia.")
            renamed = safe_name(requested + source.suffix, ignore=name)
            if not renamed: raise ValueError("Nieprawidłowa nazwa pliku.")
            if renamed == name: return self.reply({"name": name})
            source.rename(PHOTOS / renamed)
            build_gallery()
            self.reply({"name": renamed})
        except (ValueError, json.JSONDecodeError, RuntimeError, OSError) as error:
            self.reply({"error": str(error)}, 400)
    def do_DELETE(self):
        if not self.path.startswith("/api/photo/"): return self.send_error(404)
        name = Path(unquote(self.path[len("/api/photo/"):])).name; source = PHOTOS / name
        if not source.is_file(): return self.send_error(404)
        shutil.move(str(source), str(TRASH / f"{int(datetime.now().timestamp())}-{name}")); build_gallery(); self.send_response(204); self.end_headers()

if __name__ == "__main__":
    try:
        setup(); server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        port = server.server_address[1]
        url = "http://127.0.0.1:{0}".format(port)
        print("Panel: {0}  (zamknij kartę panelu, aby zatrzymać serwer)".format(url))
        webbrowser.open(url)
        try: server.serve_forever()
        except KeyboardInterrupt: pass
        finally: server.server_close()
    except OSError as error:
        print("Nie można uruchomić panelu:", error)
        raise SystemExit(1)
