
document.addEventListener('DOMContentLoaded', function() {
    
    checkAuthStatus().then(user => {
        if (user) {
            initializeAIAssistant(user);
        } else {
            window.location.href = 'login.html';
        }
    });

    
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    
    const chatForm = document.getElementById('ai-chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessageToAI();
        });
    }

    
    const suggestedQueries = document.querySelectorAll('.suggested-query');
    suggestedQueries.forEach(button => {
        button.addEventListener('click', () => {
            const query = button.textContent.trim();
            document.getElementById('ai-message-input').value = query;
            sendMessageToAI();
        });
    });

    
    const clearChatBtn = document.getElementById('clear-chat-btn');
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
            clearChat();
        });
    }
});


let currentUser = null;
let chatHistory = [];
let socket = null;


function initializeAIAssistant(user) {
    currentUser = user;
    
    
    socket = io();
    
    
    setupSocketListeners();
    
    
    loadChatHistory();
}


function setupSocketListeners() {
    
    socket.on('ai-response', (data) => {
        if (data.userId === currentUser.id) {
            addMessageToChat('ai', data.message);
            saveChatHistory();
        }
    });
    
    
    socket.on('ai-typing', (data) => {
        if (data.userId === currentUser.id) {
            showTypingIndicator();
        }
    });
    
    
    socket.on('connect', () => {
        console.log('Connected to socket server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
    });
}


function sendMessageToAI() {
    const messageInput = document.getElementById('ai-message-input');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    
    addMessageToChat('user', message);
    
    
    messageInput.value = '';
    
    
    showTypingIndicator();
    
    
    socket.emit('ai-message', {
        userId: currentUser.id,
        message: message
    });
    
    
    saveChatHistory();
}


function addMessageToChat(sender, message) {
    const chatContainer = document.getElementById('chat-container');
    
    if (!chatContainer) return;
    
    
    const existingIndicator = document.getElementById('typing-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = 'flex items-start';
    
    if (sender === 'user') {
        
        messageElement.innerHTML = `
            <div class="ml-auto">
                <div class="bg-indigo-600 text-white rounded-lg p-3 max-w-3/4">
                    <p>${formatMessage(message)}</p>
                </div>
            </div>
        `;
        
        
        chatHistory.push({ sender, message });
        
    } else if (sender === 'ai') {
        
        messageElement.innerHTML = `
            <div class="flex-shrink-0 mr-3">
                <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-robot"></i>
                </div>
            </div>
            <div class="bg-indigo-100 rounded-lg p-3 max-w-3/4">
                <p class="text-gray-800">${formatMessage(message)}</p>
            </div>
        `;
        
        
        chatHistory.push({ sender, message });
    }
    
    chatContainer.appendChild(messageElement);
    
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


function showTypingIndicator() {
    const chatContainer = document.getElementById('chat-container');
    
    if (!chatContainer) return;
    
    
    if (document.getElementById('typing-indicator')) return;
    
    const indicatorElement = document.createElement('div');
    indicatorElement.id = 'typing-indicator';
    indicatorElement.className = 'flex items-start';
    indicatorElement.innerHTML = `
        <div class="flex-shrink-0 mr-3">
            <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <i class="fas fa-robot"></i>
            </div>
        </div>
        <div class="bg-indigo-100 rounded-lg p-3 max-w-3/4">
            <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
            </div>
        </div>
    `;
    
    chatContainer.appendChild(indicatorElement);
    
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


function formatMessage(message) {
    
    message = message.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" class="text-blue-600 hover:underline">$1</a>'
    );
    
    
    message = message.replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>'
    );
    
    
    message = message.replace(
        /\*(.*?)\*/g,
        '<em>$1</em>'
    );
    
    
    message = message.replace(
        /\n---\n/g,
        '<hr class="my-2 border-gray-300">'
    );
    
    
    message = message.replace(/\n/g, '<br>');
    
    return message;
}


function saveChatHistory() {
    localStorage.setItem(`ai-chat-${currentUser.id}`, JSON.stringify(chatHistory));
}


function loadChatHistory() {
    const savedChat = localStorage.getItem(`ai-chat-${currentUser.id}`);
    
    if (savedChat) {
        try {
            chatHistory = JSON.parse(savedChat);
            
            
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer) {
                
                const welcomeMessage = chatContainer.children[0];
                chatContainer.innerHTML = '';
                chatContainer.appendChild(welcomeMessage);
                
                
                chatHistory.forEach(item => {
                    addMessageToChat(item.sender, item.message);
                });
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            chatHistory = [];
        }
    }
}


function clearChat() {
    const chatContainer = document.getElementById('chat-container');
    
    if (chatContainer) {
        
        const welcomeMessage = chatContainer.children[0];
        chatContainer.innerHTML = '';
        chatContainer.appendChild(welcomeMessage);
    }
    
    
    chatHistory = [];
    saveChatHistory();
}
