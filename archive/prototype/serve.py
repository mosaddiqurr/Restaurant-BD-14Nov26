"""Local preview server for the khabo prototype.
Same as `python -m http.server`, but tells the browser never to cache, so every refresh shows the latest files.
Usage: python serve.py [port]   (default 8765)"""
import http.server, os, sys

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
http.server.ThreadingHTTPServer(('', port), NoCache).serve_forever()
