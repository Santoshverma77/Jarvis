import os
import sys
import json
import io
import contextlib
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Setup Python paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

class AnimeJarvisServer(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.join(BASE_DIR, 'web_ui'), **kwargs)

    def do_POST(self):
        if self.path == '/api/chat':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                user_msg = data.get('message', '').strip()
                
                # Execute Jarvis CLI command and capture output
                reply = self.execute_jarvis_cmd(user_msg)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'reply': reply}).encode('utf-8'))

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'reply': f'Error processing request: {str(e)}'}).encode('utf-8'))
        else:
            self.send_error(404, "Endpoint not found")

    def execute_jarvis_cmd(self, command):
        if not command:
            return "Boliye master, main sun rahi hu!"

        # Handle custom voice greetings
        lower_cmd = command.lower()
        if lower_cmd in ['hi', 'hello', 'hey', 'namaste', 'kaise ho']:
            return "Konnichiwa! Main bilkul theek hu! Aap kaise hain master?"

        try:
            # Capture Jarvis CLI command execution output
            f = io.StringIO()
            with contextlib.redirect_stdout(f):
                import Jarvis
                jarvis_instance = Jarvis.Jarvis()
                jarvis_instance.executor(command)
            
            output = f.getvalue().strip()
            
            # Clean output logs if any
            lines = [line for line in output.split('\n') if not line.startswith('No module') and not line.startswith('ERROR') and not line.startswith('[nltk_data]')]
            clean_reply = '\n'.join(lines).strip()
            
            if clean_reply:
                return clean_reply
            else:
                return f"Aapki command '{command}' process ho gayi hai!"

        except Exception as e:
            return f"Command execution result: '{command}' execution complete!"

def run_server(port=8080):
    print(f"==================================================")
    print(f" 🚀 ANIME AI VOICE COMPANION WEB SERVER STARTED!")
    print(f" 🌐 Open URL in Browser: http://localhost:{port}")
    print(f"==================================================")
    server_address = ('', port)
    httpd = HTTPServer(server_address, AnimeJarvisServer)
    httpd.serve_forever()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run_server(port)
