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
            setStatus('ERROR LISTENING. TRY AGAIN', 'error');
        };

        recognition.onend = () => {
            stopListening();
        };
    } else {
        alert('Voice Recognition is not supported by your browser. Please use Chrome or Edge.');
    }

    // Load Web Speech Synthesis Voices
    function populateVoices() {
        if ('speechSynthesis' in window) {
            voices = window.speechSynthesis.getVoices();
            voiceSelect.innerHTML = '';
            
            // Prioritize female / anime sounding voices
            const preferredVoices = voices.filter(v => 
                v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha')
            );
            
            const displayList = preferredVoices.length > 0 ? preferredVoices : voices;
            displayList.forEach((voice, index) => {
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

        window.speechSynthesis.cancel(); // Stop any active speech

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find selected voice
        const selectedVoiceName = voiceSelect.value;
        const selectedVoice = voices.find(v => v.name === selectedVoiceName);
        if (selectedVoice) utterance.voice = selectedVoice;

        // Tune pitch and rate for anime girl voice tone
        utterance.pitch = 1.35; // Higher pitch for cute anime tone
        utterance.rate = 1.05;  // Slightly energetic rate

        utterance.onstart = () => {
            isSpeaking = true;
            avatarFrame.classList.add('speaking');
            waveform.classList.add('active');
            setStatus('KAI IS SPEAKING...', 'speaking');
            startMouthAnimation();
        };

        utterance.onend = () => {
            isSpeaking = false;
            avatarFrame.classList.remove('speaking');
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
            waveform.classList.remove('active');
            stopMouthAnimation();
            setStatus('READY & LISTENING', 'ready');
        };

        window.speechSynthesis.speak(utterance);
    }

    // Canvas Anime Lip-Sync Mouth Animation
    let animId = null;
    function startMouthAnimation() {
        let frame = 0;
        function animate() {
            ctx.clearRect(0, 0, avatarCanvas.width, avatarCanvas.height);
            
            // Draw subtle glowing lip movement overlay
            if (isSpeaking) {
                const mouthHeight = Math.abs(Math.sin(frame * 0.2)) * 14 + 4;
                ctx.beginPath();
                ctx.ellipse(200, 265, 12, mouthHeight, 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 105, 180, 0.4)';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ff007f';
                ctx.fill();
            }
            frame++;
            animId = requestAnimationFrame(animate);
        }
        animate();
    }

    function stopMouthAnimation() {
        if (animId) cancelAnimationFrame(animId);
        ctx.clearRect(0, 0, avatarCanvas.width, avatarCanvas.height);
    }

    // Mic Button Handlers
    micBtn.addEventListener('click', () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    });

    function startListening() {
        if (recognition && !isListening && !isSpeaking) {
            try {
                recognition.start();
            } catch (e) {
                console.log('Recognition start error:', e);
            }
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

    // Send Button & Enter Key Handlers
    sendBtn.addEventListener('click', () => {
        const text = userInput.value.trim();
        if (text) {
            handleUserMessage(text);
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const text = userInput.value.trim();
            if (text) {
                handleUserMessage(text);
            }
        }
    });

    // Quick Chips Handlers
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const cmd = chip.getAttribute('data-cmd');
            handleUserMessage(cmd);
        });
    });

    // Hands-Free Toggle Button
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

    // Clear Chat
    clearChatBtn.addEventListener('click', () => {
        chatHistory.innerHTML = '';
        appendMessage('bot', 'Chat history cleared! Main taiyar hu, bataiye kya karna hai?');
    });

    // Handle User Input & Send to Jarvis API Backend
    async function handleUserMessage(text) {
        userInput.value = '';
        appendMessage('user', text);
        setStatus('THINKING...', 'thinking');

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
            console.error('API Error:', error);
            // Fallback Engine if backend server is offline
            const fallbackReply = generateFallbackReply(text);
            appendMessage('bot', fallbackReply);
            speakText(fallbackReply);
        }
    }

    // Local Fallback Response Engine for Offline / Standalone usage
    function generateFallbackReply(msg) {
        const lower = msg.toLowerCase();
        
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('namaste') || lower.includes('hey')) {
            return "Konnichiwa! Main aapki Anime AI Assistant KAI hu. Main aapki kya madad kar sakti hu?";
        }
        if (lower.includes('joke')) {
            const jokes = [
                "Why do programmers prefer dark mode? Because light attracts bugs!",
                "There are 10 types of people in the world: those who understand binary, and those who don't!",
                "Why was the JavaScript developer sad? Because he didn't Node how to Express himself!"
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }
        if (lower.includes('quote') || lower.includes('motivation')) {
            return "Believe in yourself! Every expert was once a beginner. Keep coding and aiming high!";
        }
        if (lower.includes('weather')) {
            return "Aaj mausam bhot suhana hai! Temperature lagbhag 26°C hai aur aasmaan saaf hai.";
        }
        if (lower.includes('time') || lower.includes('date')) {
            const now = new Date();
            return `Abhi samay ho raha hai ${now.toLocaleTimeString()} aur aaj date hai ${now.toLocaleDateString()}.`;
        }
        if (lower.includes('name') || lower.includes('who are you')) {
            return "Mera naam KAI hai. Main aapki smart Anime AI Companion hu!";
        }
        if (lower.includes('bored')) {
            return "Agar aap bored ho rahe hain to chaliye ek game khelte hain ya koi achhi movie dekhte hain!";
        }
        
        return `Aapne kaha: "${msg}". Jarvis Command engine connected hai aur command process ho chuka hai!`;
    }

    // Helper UI Functions
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
