/**
 * KAI - Production AI Voice Assistant Engine
 * Inspired by Nova Voice Assistant Experience
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. STATE MACHINE ENUM
    const VoiceState = {
        IDLE: 'IDLE',
        LISTENING: 'LISTENING',
        PROCESSING: 'PROCESSING',
        RESPONDING: 'RESPONDING'
    };

    let currentState = VoiceState.IDLE;

    // 2. DOM ELEMENTS
    const body = document.body;
    const micBtn = document.getElementById('micBtn');
    const interruptBtn = document.getElementById('interruptBtn');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatHistory = document.getElementById('chatHistory');
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    const subtitleText = document.getElementById('subtitleText');
    const animeAvatar = document.getElementById('animeAvatar');
    const voiceSelect = document.getElementById('voiceSelect');
    const handsFreeBtn = document.getElementById('handsFreeBtn');
    const newSessionBtn = document.getElementById('newSessionBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const replayBtn = document.getElementById('replayBtn');
    const audioOrbCanvas = document.getElementById('audioOrbCanvas');
    const toastBanner = document.getElementById('toastBanner');
    const toastMessage = document.getElementById('toastMessage');
    const toastClose = document.getElementById('toastClose');
    const ctx = audioOrbCanvas ? audioOrbCanvas.getContext('2d') : null;

    // 3. AUDIO & SPEECH VARIABLES
    let audioCtx = null;
    let analyserNode = null;
    let micStream = null;
    let micSourceNode = null;
    let recognition = null;
    let voices = [];
    let isHandsFree = false;
    let lastResponseText = "";
    let animFrameId = null;

    // Toast Banner Helper
    function showToast(msg, duration = 4000) {
        if (!toastBanner || !toastMessage) return;
        toastMessage.textContent = msg;
        toastBanner.classList.remove('hidden');
        if (duration > 0) {
            setTimeout(() => {
                toastBanner.classList.add('hidden');
            }, duration);
        }
    }
    if (toastClose) toastClose.addEventListener('click', () => toastBanner.classList.add('hidden'));

    // 4. CENTRAL STATE MACHINE TRANSITION ENGINE
    function setState(newState) {
        currentState = newState;
        body.className = `state-${newState.toLowerCase()}`;
        if (statusBadge) statusBadge.setAttribute('data-state', newState);

        switch (newState) {
            case VoiceState.IDLE:
                if (statusText) statusText.textContent = 'READY & IDLE';
                if (subtitleText) subtitleText.textContent = '"Boliye master, main sun rahi hu..."';
                if (micBtn) micBtn.classList.remove('listening');
                if (interruptBtn) interruptBtn.classList.add('hidden');
                stopMicrophoneStream();
                break;

            case VoiceState.LISTENING:
                if (statusText) statusText.textContent = 'LISTENING TO YOUR VOICE...';
                if (subtitleText) subtitleText.textContent = 'Aapki aawaz sun rahi hu...';
                if (micBtn) micBtn.classList.add('listening');
                if (interruptBtn) interruptBtn.classList.add('hidden');
                break;

            case VoiceState.PROCESSING:
                if (statusText) statusText.textContent = 'PROCESSING THOUGHTS...';
                if (subtitleText) subtitleText.textContent = 'Sawal ka jawaab dhoondh rahi hu...';
                if (micBtn) micBtn.classList.remove('listening');
                if (interruptBtn) interruptBtn.classList.add('hidden');
                break;

            case VoiceState.RESPONDING:
                if (statusText) statusText.textContent = 'KAI IS SPEAKING...';
                if (subtitleText) subtitleText.textContent = 'Aapko jawaab de rahi hu...';
                if (micBtn) micBtn.classList.remove('listening');
                if (interruptBtn) interruptBtn.classList.remove('hidden');
                break;
        }
    }

    // 5. WEB AUDIO API & REAL-TIME AUDIO VISUALIZER ORB
    function initAudioContext() {
        try {
            if (!audioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    audioCtx = new AudioContextClass();
                    analyserNode = audioCtx.createAnalyser();
                    analyserNode.fftSize = 64;
                }
            }
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        } catch (e) {
            console.warn('AudioContext init error:', e);
        }
    }

    async function setupMicrophoneAudio() {
        initAudioContext();
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            if (audioCtx && analyserNode) {
                micSourceNode = audioCtx.createMediaStreamSource(micStream);
                micSourceNode.connect(analyserNode);
            }
            return true;
        } catch (err) {
            console.warn('Microphone stream error:', err);
            return false;
        }
    }

    function stopMicrophoneStream() {
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
        }
        if (micSourceNode) {
            try { micSourceNode.disconnect(); } catch (e) {}
            micSourceNode = null;
        }
    }

    // 60 FPS Glowing Particle Audio Visualizer Render Loop
    let orbFrame = 0;
    function renderVisualizerOrb() {
        if (!ctx || !audioOrbCanvas) return;
        ctx.clearRect(0, 0, audioOrbCanvas.width, audioOrbCanvas.height);
        
        let audioVolume = 0;
        if (analyserNode && currentState === VoiceState.LISTENING) {
            const freqData = new Uint8Array(analyserNode.frequencyBinCount);
            analyserNode.getByteFrequencyData(freqData);
            let sum = 0;
            for (let i = 0; i < freqData.length; i++) sum += freqData[i];
            audioVolume = sum / freqData.length;
        } else if (currentState === VoiceState.RESPONDING) {
            audioVolume = Math.abs(Math.sin(orbFrame * 0.2)) * 40 + 20;
        }

        const centerX = audioOrbCanvas.width / 2;
        const centerY = audioOrbCanvas.height / 2;
        const baseRadius = 90 + (audioVolume * 0.35);

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        
        if (currentState === VoiceState.LISTENING) {
            ctx.strokeStyle = 'rgba(255, 0, 127, 0.7)';
            ctx.shadowColor = '#ff007f';
        } else if (currentState === VoiceState.RESPONDING) {
            ctx.strokeStyle = 'rgba(127, 0, 255, 0.8)';
            ctx.shadowColor = '#7f00ff';
        } else if (currentState === VoiceState.PROCESSING) {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
            ctx.shadowColor = '#f59e0b';
        } else {
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.5)';
            ctx.shadowColor = '#00f2fe';
        }
        
        ctx.lineWidth = 4 + (audioVolume * 0.05);
        ctx.shadowBlur = 20 + (audioVolume * 0.4);
        ctx.stroke();
        ctx.restore();

        if (currentState === VoiceState.RESPONDING) {
            const mouthHeight = Math.abs(Math.sin(orbFrame * 0.3)) * 12 + 3;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + 55, 12, mouthHeight, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 105, 180, 0.6)';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff007f';
            ctx.fill();
        }

        orbFrame++;
        animFrameId = requestAnimationFrame(renderVisualizerOrb);
    }
    renderVisualizerOrb();

    // 6. SPEECH RECOGNITION (VOICE INPUT)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setState(VoiceState.LISTENING);
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            if (userInput) userInput.value = transcript;

            if (event.results[0].isFinal) {
                handleUserMessage(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.warn('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                showToast('Microphone access blocked. Click the lock icon in browser address bar to allow mic access.', 6000);
            } else if (event.error !== 'no-speech') {
                showToast(`Speech recognition note: ${event.error}`, 3000);
            }
            if (currentState === VoiceState.LISTENING) {
                setState(VoiceState.IDLE);
            }
        };

        recognition.onend = () => {
            if (currentState === VoiceState.LISTENING) {
                setState(VoiceState.IDLE);
            }
        };
    } else {
        showToast('Speech recognition is not supported in this browser version. You can type messages.', 6000);
    }

    async function startListening() {
        initAudioContext();
        if (currentState === VoiceState.RESPONDING) {
            interruptResponse();
        }
        
        // 1. Start Native Speech Recognition Immediately
        if (recognition) {
            try {
                recognition.start();
            } catch (e) {
                console.warn('Recognition start exception:', e);
            }
        } else {
            showToast('Speech recognition is not supported in this browser. Please type your message.', 4000);
            return;
        }

        // 2. Setup Audio Visualizer Non-Blockingly
        setupMicrophoneAudio().catch(err => console.log('Visualizer mic setup note:', err));
    }

    function stopListening() {
        if (recognition && currentState === VoiceState.LISTENING) {
            try { recognition.stop(); } catch (e) {}
        }
        setState(VoiceState.IDLE);
    }

    // 7. SPEECH SYNTHESIS & INTERRUPTION (BARGE-IN)
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

    function speakText(text) {
        if (!('speechSynthesis' in window)) {
            setState(VoiceState.IDLE);
            return;
        }

        try {
            window.speechSynthesis.cancel();
            lastResponseText = text;

            const utterance = new SpeechSynthesisUtterance(text);
            if (voiceSelect) {
                const selectedVoiceName = voiceSelect.value;
                const selectedVoice = voices.find(v => v.name === selectedVoiceName) || voices[0];
                if (selectedVoice) utterance.voice = selectedVoice;
            }

            utterance.pitch = 1.25;
            utterance.rate = 1.0;

            utterance.onstart = () => {
                setState(VoiceState.RESPONDING);
            };

            utterance.onend = () => {
                if (isHandsFree) {
                    setTimeout(() => startListening(), 600);
                } else {
                    setState(VoiceState.IDLE);
                }
            };

            utterance.onerror = (e) => {
                console.warn('Speech synthesis error:', e);
                setState(VoiceState.IDLE);
            };

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error('Speech synthesis exception:', e);
            setState(VoiceState.IDLE);
        }
    }

    function interruptResponse() {
        if ('speechSynthesis' in window) {
            try { window.speechSynthesis.cancel(); } catch (e) {}
        }
        showToast('Interrupted AI response', 2000);
        setState(VoiceState.IDLE);
    }

    if (interruptBtn) interruptBtn.addEventListener('click', interruptResponse);

    // 8. INTERACTION & CONVERSATION HANDLERS
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (currentState === VoiceState.LISTENING) {
                stopListening();
            } else {
                startListening();
            }
        });
    }

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

    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            handleUserMessage(chip.getAttribute('data-cmd'));
        });
    });

    if (handsFreeBtn) {
        handsFreeBtn.addEventListener('click', () => {
            isHandsFree = !isHandsFree;
            handsFreeBtn.classList.toggle('active', isHandsFree);
            const textSpan = handsFreeBtn.querySelector('.btn-text');
            if (isHandsFree) {
                if (textSpan) textSpan.textContent = 'Hands-Free: ON';
                showToast('Hands-Free Mode Activated', 3000);
                startListening();
            } else {
                if (textSpan) textSpan.textContent = 'Hands-Free';
                showToast('Hands-Free Mode Deactivated', 3000);
                stopListening();
            }
        });
    }

    if (newSessionBtn) {
        newSessionBtn.addEventListener('click', () => {
            interruptResponse();
            if (chatHistory) chatHistory.innerHTML = '';
            appendMessage('bot', 'New conversation session started! Boliye master, main kaise madad karu?');
            showToast('Started new conversation session', 3000);
        });
    }

    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
            if (chatHistory) chatHistory.innerHTML = '';
            showToast('Cleared conversation history', 2000);
        });
    }

    if (replayBtn) {
        replayBtn.addEventListener('click', () => {
            if (lastResponseText) {
                speakText(lastResponseText);
            } else {
                showToast('No previous AI response to replay.', 3000);
            }
        });
    }

    // 9. INTENT ROUTING & BACKEND COMMUNICATOR
    async function handleUserMessage(text) {
        if (userInput) userInput.value = '';
        if (currentState === VoiceState.RESPONDING) {
            interruptResponse();
        }

        appendMessage('user', text);
        setState(VoiceState.PROCESSING);

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

        // INTENT 2: Web Search
        if (lowerText.includes('search') || lowerText.includes('dhundho') || lowerText.includes('google')) {
            let query = lowerText.replace(/search|dhundho|google|karo|per/gi, '').trim();
            const reply = `Google par '${query}' search kar rahi hu!`;
            appendMessage('bot', reply);
            speakText(reply);
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
            return;
        }

        // Standard API Fetch
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
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (sender === 'bot') {
            msgDiv.innerHTML = `
                <div class="msg-avatar"><img src="anime_avatar.jpg" alt="Kai"></div>
                <div class="msg-content">
                    <div class="msg-meta">
                        <span class="sender-name">KAI (AI Companion)</span>
                        <span class="msg-time">${timeStr}</span>
                    </div>
                    <p>${text}</p>
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="msg-avatar">YOU</div>
                <div class="msg-content">
                    <div class="msg-meta">
                        <span class="sender-name" style="color: #4facfe">YOU</span>
                        <span class="msg-time">${timeStr}</span>
                    </div>
                    <p>${text}</p>
                </div>
            `;
        }

        chatHistory.appendChild(msgDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
});
