document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const micBtn = document.getElementById('micBtn');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatHistory = document.getElementById('chatHistory');
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    const avatarFrame = document.getElementById('avatarFrame');
    const animeAvatar = document.getElementById('animeAvatar');
    const waveform = document.getElementById('waveform');
    const voiceSelect = document.getElementById('voiceSelect');
    const handsFreeBtn = document.getElementById('handsFreeBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const avatarCanvas = document.getElementById('avatarCanvas');
    const ctx = avatarCanvas.getContext('2d');

    let isListening = false;
    let isSpeaking = false;
    let isHandsFree = false;
    let recognition = null;
    let voices = [];

    // Initialize Web Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isListening = true;
            micBtn.classList.add('listening');
            waveform.classList.add('active');
            setStatus('LISTENING TO YOUR VOICE...', 'listening');
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            userInput.value = transcript;

            if (event.results[0].isFinal) {
                handleUserMessage(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopListening();
            setStatus('READY & LISTENING', 'ready');
        };

        recognition.onend = () => {
            stopListening();
        };
    }

    // Load Web Speech Synthesis Voices
    function populateVoices() {
        if ('speechSynthesis' in window) {
            voices = window.speechSynthesis.getVoices();
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

    populateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoices;
    }

    // Text to Speech Function (Anime Girl Voice)
    function speakText(text) {
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        const selectedVoiceName = voiceSelect.value;
        const selectedVoice = voices.find(v => v.name === selectedVoiceName);
        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.pitch = 1.35; // Cute energetic anime tone
        utterance.rate = 1.05;

        utterance.onstart = () => {
            isSpeaking = true;
            avatarFrame.classList.add('speaking');
            animeAvatar.classList.add('avatar-talking');
            waveform.classList.add('active');
            setStatus('KAI IS SPEAKING...', 'speaking');
            startMouthAnimation();
        };

        utterance.onend = () => {
            isSpeaking = false;
            avatarFrame.classList.remove('speaking');
            animeAvatar.classList.remove('avatar-talking');
            waveform.classList.remove('active');
            stopMouthAnimation();
            
            if (isHandsFree) {
                setTimeout(() => startListening(), 800);
            } else {
                setStatus('READY & LISTENING', 'ready');
            }
        };

        utterance.onerror = () => {
            isSpeaking = false;
            avatarFrame.classList.remove('speaking');
            animeAvatar.classList.remove('avatar-talking');
            waveform.classList.remove('active');
            stopMouthAnimation();
            setStatus('READY & LISTENING', 'ready');
        };

        window.speechSynthesis.speak(utterance);
    }

    // Interactive Animated Character Canvas Overlay (Blinking + Breathing + Lip Sync)
    let animId = null;
    let blinkTimer = 0;
    function startMouthAnimation() {
        let frame = 0;
        function animate() {
            ctx.clearRect(0, 0, avatarCanvas.width, avatarCanvas.height);
            
            // Mouth Lip-Sync Movement
            if (isSpeaking) {
                const mouthHeight = Math.abs(Math.sin(frame * 0.25)) * 14 + 4;
                ctx.beginPath();
                ctx.ellipse(200, 260, 14, mouthHeight, 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 105, 180, 0.6)';
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#ff007f';
                ctx.fill();
            }

            // Eye Blink Effect
            blinkTimer++;
            if (blinkTimer % 180 < 10) {
                ctx.fillStyle = 'rgba(20, 25, 45, 0.95)';
                ctx.fillRect(145, 160, 45, 15);
                ctx.fillRect(210, 160, 45, 15);
            }

            frame++;
            animId = requestAnimationFrame(animate);
        }
        animate();
    }
    startMouthAnimation();

    function stopMouthAnimation() {
        ctx.clearRect(0, 0, avatarCanvas.width, avatarCanvas.height);
    }

    // Mic Controls
    micBtn.addEventListener('click', () => {
        if (isListening) stopListening();
        else startListening();
    });

    function startListening() {
        if (recognition && !isListening && !isSpeaking) {
            try { recognition.start(); } catch (e) { console.log(e); }
        }
    }

    function stopListening() {
        if (recognition && isListening) {
            recognition.stop();
            isListening = false;
            micBtn.classList.remove('listening');
            waveform.classList.remove('active');
            setStatus('READY & LISTENING', 'ready');
        }
    }

    sendBtn.addEventListener('click', () => {
        const text = userInput.value.trim();
        if (text) handleUserMessage(text);
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const text = userInput.value.trim();
            if (text) handleUserMessage(text);
        }
    });

    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            handleUserMessage(chip.getAttribute('data-cmd'));
        });
    });

    handsFreeBtn.addEventListener('click', () => {
        isHandsFree = !isHandsFree;
        handsFreeBtn.classList.toggle('active', isHandsFree);
        if (isHandsFree) {
            handsFreeBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Hands-Free: ON`;
            startListening();
        } else {
            handsFreeBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Hands-Free Mode`;
            stopListening();
        }
    });

    clearChatBtn.addEventListener('click', () => {
        chatHistory.innerHTML = '';
        appendMessage('bot', 'Chat history cleared! Main taiyar hu master!');
    });

    // Handle User Input & Action Commands (YouTube, Search, System Apps)
    async function handleUserMessage(text) {
        userInput.value = '';
        appendMessage('user', text);
        setStatus('THINKING...', 'thinking');

        const lowerText = text.toLowerCase();

        // 🎵 Intent 1: YouTube Music / Song Playback
        if (lowerText.includes('youtube') || lowerText.includes('song') || lowerText.includes('baja') || lowerText.includes('music') || lowerText.includes('play')) {
            let query = lowerText.replace(/play|song|baja|batao|youtube|ko|me|main|se|mujhe|chalao|dikhao|baja do|kar dikhao|romantic|sa/gi, '').trim();
            if (!query || query.length < 2) query = 'romantic songs hindi';

            const reply = `Aapke liye YouTube par '${query}' song play kar rahi hu master!`;
            appendMessage('bot', reply);
            speakText(reply);

            // Open YouTube search/song directly in a new browser tab!
            const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
            setTimeout(() => {
                window.open(ytUrl, '_blank');
            }, 1000);
            return;
        }

        // 🔍 Intent 2: Google Web Search
        if (lowerText.includes('search') || lowerText.includes('dhundho') || lowerText.includes('google')) {
            let query = lowerText.replace(/search|dhundho|google|karo|per/gi, '').trim();
            const reply = `Google par '${query}' search kar rahi hu!`;
            appendMessage('bot', reply);
            speakText(reply);
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
            return;
        }

        // Standard API Request to Backend Server
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            const reply = data.reply || "Main samajh nahi paayi, kya aap dobara bol sakte hain?";
            
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
            return "Konnichiwa! Main aapki Anime AI Assistant KAI hu. Aap mujhse bol kar song bajwa sakte hain ya system search karwa sakte hain!";
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
            return `Abhi samay ho raha hai ${now.toLocaleTimeString()} aur date hai ${now.toLocaleDateString()}.`;
        }
        return `Aapne kaha: "${msg}". Main aapki command follow kar rahi hu master!`;
    }

    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${sender}-msg`;

        if (sender === 'bot') {
            msgDiv.innerHTML = `
                <div class="msg-avatar"><img src="anime_avatar.jpg" alt="Kai"></div>
                <div class="msg-content">
                    <span class="sender-name">KAI (Anime AI)</span>
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

    function setStatus(text, type) {
        statusText.textContent = text;
        if (type === 'listening') {
            statusIndicator.style.borderColor = '#ff007f';
            statusIndicator.style.color = '#ff007f';
        } else if (type === 'speaking') {
            statusIndicator.style.borderColor = '#00f2fe';
            statusIndicator.style.color = '#00f2fe';
        } else {
            statusIndicator.style.borderColor = 'rgba(0, 242, 254, 0.3)';
            statusIndicator.style.color = 'var(--primary-neon)';
        }
    }
});
