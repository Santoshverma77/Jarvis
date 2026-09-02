from http.server import BaseHTTPRequestHandler
import json
import random
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            user_msg = data.get('message', '').strip()
            
            reply = self.get_response(user_msg)
            
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
            self.wfile.write(json.dumps({'reply': f'Error: {str(e)}'}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def get_response(self, msg):
        if not msg:
            return "Boliye master, main aapki kya madad kar sakti hu?"
        
        lower = msg.lower()
        if any(w in lower for w in ['hi', 'hello', 'hey', 'namaste', 'kaise ho']):
            return "Konnichiwa! Main aapki Anime AI Companion KAI hu. Main aapki kya madad kar sakti hu?"
        elif 'joke' in lower:
            jokes = [
                "Why do programmers prefer dark mode? Because light attracts bugs!",
                "There are 10 types of people in the world: those who understand binary, and those who don't!",
                "Why was the JavaScript developer sad? Because he didn't Node how to Express himself!"
            ]
            return random.choice(jokes)
        elif 'quote' in lower or 'motivation' in lower:
            return "Believe in yourself! Every expert was once a beginner. Keep coding and aiming high!"
        elif 'weather' in lower:
            return "Aaj mausam bhot achha hai! Temperature 26°C hai aur clear sky hai."
        elif 'time' in lower or 'date' in lower:
            now = datetime.now()
            return f"Abhi samay ho raha hai {now.strftime('%I:%M %p')} aur date hai {now.strftime('%d %B %Y')}."
        elif 'bored' in lower:
            return "Agar aap bored ho rahe hain to chaliye ek game khelte hain ya koi song sunte hain!"
        else:
            return f"Aapne kaha: '{msg}'. Main taiyar hu master!"
