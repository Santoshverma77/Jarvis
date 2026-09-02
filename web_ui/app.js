document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const micBtn = document.getElementById('micBtn');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatHistory = document.getElementById('chatHistory');
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    const avatarFrame = document.getElementById('avatarFrame');
    const waveform = document.getElementById('waveform');
    const voiceSelect = document.getElementById('voiceSelect');
    const handsFreeBtn = document.getElementById('handsFreeBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');

    let isListening = false;
    let isSpeaking = false;
    let isHandsFree = false;
    let recognition = null;
    let voices = [];

    // Initialize Web Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        try {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                isListening = true;
                if (micBtn) micBtn.classList.add('listening');
                if (waveform) waveform.classList.add('active');
                setStatus('LISTENING TO YOUR VOICE...', '#ff007f');
            };

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');

                if (userInput) userInput.value = transcript;

                if (event.results[0] && event.results[0].isFinal) {
                    handleUserMessage(transcript);
                }
            };

            recognition.onerror = (event) => {
                console.log('Speech recognition event:', event.error);
                stopListening();
            };

            recognition.onend = () => {
                stopListening();
            };
        } catch (e) {
            console.warn('Speech recognition init error:', e);
        }
    }

    // Populate Web Speech Voices
    function populateVoices() {
        if ('speechSynthesis' in window) {
            voices = window.speechSynthesis.getVoices();
            if (voiceSelect) {
                voiceSelect.innerHTML = '';
                const preferredVoices = voices.filter(v => 
                    v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Hindi')
                );
                
                const displayList = preferredVoices.length > 0 ? preferredVoices : voices;
                displayList.forEach((voice) => {
                    const option = document.createElement('option');
                    option.value = voice.name;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    voiceSelect.appendChild(option);
                });
            }
        }
    }

    populateVoices();
    if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoices;
    }

    // Speech Synthesis
    function speakText(text) {
        if (!('speechSynthesis' in window)) return;

        try {
            window.speechSynthesis.cancel(); // Stop prior speech

            const utterance = new SpeechSynthesisUtterance(text);
            if (voiceSelect) {
                const selectedVoiceName = voiceSelect.value;
                const selectedVoice = voices.find(v => v.name === selectedVoiceName) || voices[0];
                if (selectedVoice) utterance.voice = selectedVoice;
            }

            utterance.pitch = 1.3;
            utterance.rate = 1.05;

            utterance.onstart = () => {
                isSpeaking = true;
                if (avatarFrame) avatarFrame.classList.add('speaking');
                if (waveform) waveform.classList.add('active');
                setStatus('KAI IS SPEAKING...', '#00f2fe');
            };

            utterance.onend = () => {
                isSpeaking = false;
                if (avatarFrame) avatarFrame.classList.remove('speaking');
                if (waveform) waveform.classList.remove('active');
                
                if (isHandsFree) {
                    setTimeout(() => startListening(), 600);
                } else {
                    setStatus('READY & LISTENING', '#00f2fe');
                }
            };

            utterance.onerror = () => {
                isSpeaking = false;
                if (avatarFrame) avatarFrame.classList.remove('speaking');
                if (waveform) waveform.classList.remove('active');
                setStatus('READY & LISTENING', '#00f2fe');
            };

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('TTS error:', e);
            setStatus('READY & LISTENING', '#00f2fe');
        }
    }

    function startListening() {
        if (isSpeaking && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (recognition) {
            try {
                recognition.start();
            } catch (e) {
                console.log('Recognition start error:', e);
            }
        } else {
            alert('Speech recognition is not supported in your browser. Please type your message in the input box below.');
        }
    }

    function stopListening() {
        isListening = false;
        if (micBtn) micBtn.classList.remove('listening');
        if (waveform) waveform.classList.remove('active');
        if (recognition) {
            try { recognition.stop(); } catch (e) {}
        }
        setStatus('READY & LISTENING', '#00f2fe');
    }

    // Mic Click Handler
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (isListening) stopListening();
            else startListening();
        });
    }

    // Send Button & Input Keypress
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            if (userInput) {
                const text = userInput.value.trim();
                if (text) handleUserMessage(text);
            }
        });
    }

    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const text = userInput.value.trim();
                if (text) handleUserMessage(text);
            }
        });
    }

    // Quick Chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const cmd = chip.getAttribute('data-cmd');
            handleUserMessage(cmd);
        });
    });

    // Hands-Free Mode Toggle
    if (handsFreeBtn) {
        handsFreeBtn.addEventListener('click', () => {
            isHandsFree = !isHandsFree;
            handsFreeBtn.classList.toggle('active', isHandsFree);
            if (isHandsFree) {
                handsFreeBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Hands-Free: ON`;
                startListening();
            } else {
                handsFreeBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Hands-Free`;
                stopListening();
            }
        });
    }

    // Clear Chat
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
            if (chatHistory) chatHistory.innerHTML = '';
            appendMessage('bot', 'Chat history cleared! Boliye master, main kaise madad karu?');
        });
    }

    // Process Message & Execute Commands
    async function handleUserMessage(text) {
        if (userInput) userInput.value = '';
        appendMessage('user', text);
        setStatus('THINKING...', '#f59e0b');

        const lowerText = text.toLowerCase();

        // INTENT 1: YouTube Music Playback
        if (lowerText.includes('youtube') || lowerText.includes('song') || lowerText.includes('baja') || lowerText.includes('music') || lowerText.includes('play')) {
            let query = lowerText.replace(/play|song|baja|batao|youtube|ko|me|main|se|mujhe|chalao|dikhao|baja do|kar dikhao|romantic|sa/gi, '').trim();
            if (!query || query.length < 2) query = 'romantic songs hindi';

            const reply = `Aapke liye YouTube par '${query}' song play kar rahi hu master!`;
            appendMessage('bot', reply);
            speakText(reply);

            const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
            setTimeout(() => {
                window.open(ytUrl, '_blank');
            }, 1000);
            return;
        }

        // INTENT 2: Google Search
        if (lowerText.includes('search') || lowerText.includes('dhundho') || lowerText.includes('google')) {
            let query = lowerText.replace(/search|dhundho|google|karo|per/gi, '').trim();
            const reply = `Google par '${query}' search kar rahi hu!`;
            appendMessage('bot', reply);
            speakText(reply);
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
            return;
        }

        // API Fetch to Python Backend
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            const reply = data.reply || "Main samajh nahi paayi, kya aap dobara keh sakte hain?";
            
            appendMessage('bot', reply);
            speakText(reply);

        } catch (error) {
            const fallbackReply = generateFallbackReply(text);
            appendMessage('bot', fallbackReply);
            speakText(fallbackReply);
        }
    }

    function generateFallbackReply(msg) {
        const lower = msg.toLowerCase();
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('namaste') || lower.includes('hey')) {
            return "Konnichiwa! Main aapki Anime AI Assistant KAI hu. Main aapki kya madad kar sakti hu?";
        }
        if (lower.includes('joke')) {
            return "Why do programmers prefer dark mode? Because light attracts bugs!";
        }
        if (lower.includes('quote') || lower.includes('motivation')) {
            return "Believe in yourself! Every expert was once a beginner. Keep coding and aiming high!";
        }
        if (lower.includes('weather')) {
            return "Aaj mausam bhot achha hai! Temperature 26°C hai aur clear sky hai.";
        }
        if (lower.includes('time') || lower.includes('date')) {
            const now = new Date();
            return `Abhi samay ho raha hai ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} aur date hai ${now.toLocaleDateString()}.`;
        }
        return `Aapne kaha: "${msg}". Main taiyar hu master!`;
    }

    function appendMessage(sender, text) {
        if (!chatHistory) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${sender}-msg`;

        if (sender === 'bot') {
            msgDiv.innerHTML = `
                <div class="msg-avatar"><img src="anime_avatar.jpg" alt="Kai"></div>
                <div class="msg-content">
                    <span class="sender-name">KAI (AI Companion)</span>
                    <p>${text}</p>
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="msg-avatar">YOU</div>
                <div class="msg-content">
                    <span class="sender-name" style="color: #4facfe">YOU</span>
                    <p>${text}</p>
                </div>
            `;
        }

        chatHistory.appendChild(msgDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function setStatus(text, color) {
        if (statusText) statusText.textContent = text;
        if (statusIndicator) {
            statusIndicator.style.borderColor = color;
            statusIndicator.style.color = color;
        }
    }
});
