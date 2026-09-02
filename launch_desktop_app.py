import sys
import os
import time
import socket
import threading

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def start_backend():
    if not is_port_in_use(8080):
        from web_ui.server import run_server
        run_server(8080)

if __name__ == '__main__':
    # Start local backend server in background thread
    t = threading.Thread(target=start_backend, daemon=True)
    t.start()

    time.sleep(1)

    try:
        import webview
        print("🚀 Opening Native Desktop Assistant Window...")
        window = webview.create_window(
            title='KAI - Native Desktop AI Assistant',
            url='http://localhost:8080',
            width=1280,
            height=850,
            resizable=True,
            confirm_close=False,
            background_color='#070913'
        )
        webview.start()
    except Exception as e:
        print(f"Opening browser fallback: {e}")
        import webbrowser
        webbrowser.open("http://localhost:8080")
