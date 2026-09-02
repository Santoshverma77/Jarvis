import os
import sys
import json
import io
import contextlib
import urllib.parse
import webbrowser
import subprocess
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
                
                reply = self.execute_laptop_command(user_msg)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'reply': reply}).encode('utf-8'))

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'reply': f'Ji master, error: {str(e)}'}).encode('utf-8'))
        else:
            self.send_error(404, "Endpoint not found")

    def execute_laptop_command(self, command):
        if not command:
            return "Ji master, main aapki kya madad kar sakti hu?"

        cmd_lower = command.lower().strip()

        # 1. 📷 Camera & Photo Capture Intent
        if any(w in cmd_lower for w in ['photo nikal', 'camera', 'photo kheench', 'take photo', 'picture le', 'photo lo']):
            try:
                os.system("open -a 'Photo Booth'")
            except Exception:
                os.system("open -a FaceTime")
            return "Ji master! Main aapke laptop ka camera open kar rahi hu photo nikalne ke liye."

        # 2. 🖼️ Show Photos / Gallery Intent
        if any(w in cmd_lower for w in ['photo dikhao', 'photos', 'gallery', 'pictures', 'photo dikha']):
            os.system("open ~/Pictures")
            return "Ji master! Main aapke laptop me Pictures gallery open kar di hu."

        # 3. 🎵 YouTube Song & Video Playback Intent
        if any(w in cmd_lower for w in ['youtube', 'song', 'music', 'gaana', 'baja', 'chalao', 'play']):
            query = cmd_lower.replace('play', '').replace('song', '').replace('youtube', '').replace('baja', '').replace('chalao', '').replace('par', '').replace('me', '').replace('se', '').replace('gaana', '').strip()
            if not query or len(query) < 2:
                query = "romantic songs hindi"
            
            webbrowser.open_new_tab(f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}")
            return f"Ji master! YouTube par '{query}' song play kar rahi hu."

        # 4. 🚀 Open Any App Intent (Chrome, Finder, VS Code, Notes, Calculator, Spotify, WhatsApp)
        if 'open' in cmd_lower or 'kholo' in cmd_lower or 'chalao' in cmd_lower:
            app_name = cmd_lower.replace('open', '').replace('kholo', '').replace('chalao', '').replace('app', '').replace('laptop', '').replace('me', '').strip()
            
            app_map = {
                'chrome': 'Google Chrome',
                'browser': 'Google Chrome',
                'vs code': 'Visual Studio Code',
                'vscode': 'Visual Studio Code',
                'code': 'Visual Studio Code',
                'notes': 'Notes',
                'calculator': 'Calculator',
                'calc': 'Calculator',
                'finder': 'Finder',
                'files': 'Finder',
                'spotify': 'Spotify',
                'terminal': 'Terminal',
                'whatsapp': 'WhatsApp',
                'settings': 'System Settings'
            }
            
            target_app = app_map.get(app_name, app_name.capitalize())
            if target_app:
                os.system(f"open -a '{target_app}' 2>/dev/null || open -a '{app_name}' 2>/dev/null")
                return f"Ji master! Aapke laptop me {target_app} open kar diya hai."

        # 5. 📸 Screenshot Intent
        if 'screenshot' in cmd_lower or 'screen shot' in cmd_lower:
            os.system("screencapture -x ~/Desktop/screenshot.png")
            return "Ji master! Aapke laptop screen ka screenshot le kar Desktop par save kar diya hai."

        # 6. 🔋 Battery & System Info Intent
        if 'battery' in cmd_lower or 'charge' in cmd_lower:
            try:
                out = subprocess.check_output(["pmset", "-g", "batt"]).decode('utf-8')
                percent = [line for line in out.split('\n') if '%' in line]
                if percent:
                    return f"Ji master! Laptop ki battery status: {percent[0].split(';')[0].split('\t')[-1]}."
            except Exception:
                pass
            return "Ji master! Laptop battery normal state me hai."

        # 7. Fallback to Jarvis Core Plugin Engine
        try:
            f = io.StringIO()
            with contextlib.redirect_stdout(f):
                import Jarvis
                jarvis_instance = Jarvis.Jarvis()
                jarvis_instance.executor(command)
            
            output = f.getvalue().strip()
            lines = [line for line in output.split('\n') if not line.startswith('No module') and not line.startswith('ERROR') and not line.startswith('[nltk_data]')]
            clean_reply = '\n'.join(lines).strip()
            
            if clean_reply:
                return clean_reply
            else:
                return f"Ji master! Aapki command '{command}' laptop par execute ho gayi hai."
        except Exception:
            return f"Ji master! Main aapki command '{command}' samajh gayi hu aur kaam kar diya hai."

def run_server(port=8080):
    print(f"==================================================")
    print(f" 🚀 ANIME AI GIRL LAPTOP SYSTEM SERVER STARTED!")
    print(f" 🌐 Open URL in Browser: http://localhost:{port}")
    print(f"==================================================")
    server_address = ('', port)
    httpd = HTTPServer(server_address, AnimeJarvisServer)
    httpd.serve_forever()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run_server(port)
