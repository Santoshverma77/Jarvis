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

    // 1. Native Hindi Speech Recognition Engine
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        try {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'hi-IN'; // Default to Hindi voice input!

            recognition.onstart = () => {
                isListening = true;
                if (micBtn) micBtn.classList.add('listening');
                if (waveform) waveform.classList.add('active');
                setStatus('Aapki aawaz sun rahi hu...', '#ff007f');
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

    // 2. Select Native Indian Female / Hindi Voice
    function populateVoices() {
        if ('speechSynthesis' in window) {
            voices = window.speechSynthesis.getVoices();
            if (voiceSelect) {
                voiceSelect.innerHTML = '';
                
                // Filter for Hindi / Indian Female voices
                const preferredVoices = voices.filter(v => 
                    v.lang.includes('hi') || v.lang.includes('IN') || v.name.includes('Hindi') || v.name.includes('Google') || v.name.includes('Swara') || v.name.includes('Female')
                );
                
                const displayList = preferredVoices.length > 0 ? preferredVoices : voices;
                displayList.forEach((voice) => {
                    const option = document.createElement('option');
                    option.value = voice.name;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    if (voice.lang.includes('hi') || voice.name.includes('Hindi')) {
                        option.selected = true;
                    }
                    voiceSelect.appendChild(option);
                });
            }
        }
    }

    populateVoices();
    if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoices;
    }

    // 3. Indian Girl Voice Speech Output
    function speakText(text) {
        if (!('speechSynthesis' in window)) return;

        try {
            window.speechSynthesis.cancel(); // Stop prior speech

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'hi-IN'; // Native Hindi pronunciation

            if (voiceSelect) {
                const selectedVoiceName = voiceSelect.value;
                const selectedVoice = voices.find(v => v.name === selectedVoiceName) || voices.find(v => v.lang.includes('hi')) || voices[0];
                if (selectedVoice) utterance.voice = selectedVoice;
            }

            utterance.pitch = 1.3; // Warm cute girl voice pitch
            utterance.rate = 1.0;

            utterance.onstart = () => {
                isSpeaking = true;
                if (avatarFrame) avatarFrame.classList.add('speaking');
                if (waveform) waveform.classList.add('active');
                setStatus('KAI bol rahi hai...', '#00f2fe');
            };

            utterance.onend = () => {
                isSpeaking = false;
                if (avatarFrame) avatarFrame.classList.remove('speaking');
                if (waveform) waveform.classList.remove('active');
                
                if (isHandsFree) {
                    setTimeout(() => startListening(), 600);
                } else {
                    setStatus('Suno master, main taiyar hu!', '#00f2fe');
                }
            };

            utterance.onerror = () => {
                isSpeaking = false;
                if (avatarFrame) avatarFrame.classList.remove('speaking');
                if (waveform) waveform.classList.remove('active');
                setStatus('Suno master, main taiyar hu!', '#00f2fe');
            };

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('TTS error:', e);
            setStatus('Suno master, main taiyar hu!', '#00f2fe');
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
            alert('Aapke browser me voice recognition support nahi hai. Aap niche text box me type kar sakte hain!');
        }
    }

    function stopListening() {
        isListening = false;
        if (micBtn) micBtn.classList.remove('listening');
        if (waveform) waveform.classList.remove('active');
        if (recognition) {
            try { recognition.stop(); } catch (e) {}
        }
        setStatus('Suno master, main taiyar hu!', '#00f2fe');
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
            appendMessage('bot', 'Chat history clear kar di hai! Boliye master, main kya karu?');
        });
    }

    // Process Message & Execute Commands
    async function handleUserMessage(text) {
        if (userInput) userInput.value = '';
        appendMessage('user', text);
        setStatus('Laptop par command execute ho rahi hai...', '#f59e0b');

        // API Fetch to Local Server
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            const reply = data.reply || "Ji master, main samajh gayi hu!";
            
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
        if (lower.includes('photo nikal') || lower.includes('camera') || lower.includes('picture')) {
            return "Ji master! Laptop ka camera open kar diya hai photo nikalne ke liye.";
        }
        if (lower.includes('photo dikha') || lower.includes('photos') || lower.includes('gallery')) {
            return "Ji master! Laptop ki Pictures gallery open kar di hai.";
        }
        if (lower.includes('youtube') || lower.includes('song') || lower.includes('gaana')) {
            return "Ji master! YouTube par aapka romantic song play kar diya hai.";
        }
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('namaste')) {
            return "Konnichiwa! Main aapki Anime AI Assistant KAI hu. Aap apne laptop me mujhse kuch bhi kholne ya karne ko keh sakte hain!";
        }
        return `Ji master! Aapne kaha: "${msg}". Main taiyar hu!`;
    }

    function appendMessage(sender, text) {
        if (!chatHistory) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${sender}-msg`;

        if (sender === 'bot') {
            msgDiv.innerHTML = `
                <div class="msg-avatar"><img src="anime_avatar.jpg" alt="Kai"></div>
                <div class="msg-content">
                    <span class="sender-name">KAI (AI Assistant)</span>
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
