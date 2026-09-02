import webbrowser
import urllib.parse
from plugin import plugin, require

@require(network=True)
@plugin('youtube')
def play_youtube(jarvis, s):
    """
    Search and play music or videos on YouTube.
    Usage:
    > youtube romantic songs
    > play romantic songs on youtube
    """
    if not s:
        jarvis.say("Opening YouTube...")
        webbrowser.open("https://www.youtube.com")
        return

    query = s.lower().replace("play", "").replace("on youtube", "").replace("youtube", "").strip()
    if not query:
        query = "trending songs"

    jarvis.say(f"Playing '{query}' on YouTube for you master...")
    encoded_query = urllib.parse.quote(query)
    url = f"https://www.youtube.com/results?search_query={encoded_query}"
    webbrowser.open_new_tab(url)

@require(network=True)
@plugin('play')
def play_song(jarvis, s):
    """
    Play any song or video on YouTube.
    Usage: > play Arijit Singh romantic songs
    """
    play_youtube(jarvis, s)
