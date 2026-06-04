
const chat = {
    currentConversation: null,
    messages: [],
    messageContainer: null,
    messageInput: null,
    sendButton: null,
    conversationsList: null,
    onlineUsers: null,
    currentUserId: null,
    
    init(userId) {
        this.currentUserId = userId;
        
        
        this.messageContainer = document.getElementById('messages-container');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.conversationsList = document.getElementById('conversations-list');
        this.onlineUsers = document.getElementById('online-users');
        
        
        if (window.socketClient) {
            this.setupSocketEvents();
            window.socketClient.connect(userId);
        }
        
        
        this.loadConversations();
        
        
        this.checkForActiveChatRedirect();
        
        
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        
        this.messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        
        this.sendButton?.addEventListener('click', () => {
            this.sendMessage();
        });
        
        
        const conversationItems = document.querySelectorAll('.conversation-item');
        console.log('Found conversation items:', conversationItems.length);
        
        conversationItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const conversationId = item.getAttribute('data-conversation-id');
                console.log('Clicked conversation:', conversationId);
                
                if (conversationId) {
                    
                    document.querySelectorAll('.conversation-item').forEach(conv => {
                        conv.closest('li').classList.remove('bg-blue-50');
                    });
                    
                    
                    item.closest('li').classList.add('bg-blue-50');
                    
                    
                    const mentorName = item.querySelector('p.text-sm.font-medium').textContent;
                    console.log('Loading conversation with:', mentorName);
                    
                    
                    this.loadConversation(conversationId);
                    
                    
                    const chatContent = document.querySelector('.chat-main-content');
                    const emptyState = document.querySelector('.md\\:hidden.flex-1');
                    if (chatContent && emptyState) {
                        chatContent.classList.remove('hidden');
                        emptyState.classList.add('hidden');
                    }
                    
                    
                    const chatHeader = document.querySelector('.chat-header h2');
                    if (chatHeader) {
                        chatHeader.textContent = mentorName;
                    }
                }
            });
        });
    },
    
    setupSocketEvents() {
        
        window.socketClient.on('new-message', (data) => {
            console.log('Received new message:', data);
            
            
            if (data.conversationId === this.currentConversation) {
                this.addMessage(data.message);
                this.scrollToBottom();
            }
            
            
            this.loadConversations();
        });
        
        
        window.socketClient.on('new-conversation', (data) => {
            console.log('New conversation created:', data);
            
            
            this.loadConversations();
        });
        
        
        window.socketClient.on('message-sent', (data) => {
            console.log('Message sent confirmation:', data);
            
            if (this.currentConversation === data.conversationId) {
                
                const lastMessage = this.messageContainer.lastElementChild;
                if (lastMessage) {
                    lastMessage.dataset.timestamp = data.timestamp;
                }
            }
        });
        
        
        window.socketClient.on('messages-read', (data) => {
            console.log('Messages read:', data);
            
            
            const messages = this.messageContainer.querySelectorAll('.message');
            messages.forEach(msg => {
                if (msg.dataset.senderId !== this.currentUserId) {
                    msg.classList.add('read');
                }
            });
        });
        
        
        window.socketClient.on('user-status-change', (data) => {
            console.log('User status change:', data);
            
            
            const conversation = this.conversationsList.querySelector(`[data-conversation-id="${data.userId}"]`);
            if (conversation) {
                const statusIndicator = conversation.querySelector('.status-indicator');
                if (statusIndicator) {
                    statusIndicator.className = `status-indicator ${data.status === 'online' ? 'online' : 'offline'}`;
                }
            }
        });
        
        
        window.socketClient.on('online-users-status', (statuses) => {
            console.log('Online users status:', statuses);
            
            
            Object.keys(statuses).forEach(userId => {
                const status = statuses[userId];
                const conversation = this.conversationsList.querySelector(`[data-conversation-id="${userId}"]`);
                if (conversation) {
                    const statusIndicator = conversation.querySelector('.status-indicator');
                    if (statusIndicator) {
                        statusIndicator.className = `status-indicator ${status === 'online' ? 'online' : 'offline'}`;
                    }
                }
            });
        });
        
        
        window.socketClient.on('conversations-list', (conversations) => {
            console.log('Received conversations list:', conversations);
            this.renderConversations(conversations);
            
            
            this.checkForActiveChatRedirect();
        });
        
        
        window.socketClient.on('messages-list', (data) => {
            console.log('Received messages list:', data);
            if (data.conversationId === this.currentConversation) {
                this.renderMessages(data.messages);
            }
        });
        
        
        window.socketClient.on('error', (error) => {
            console.error('Chat error:', error);
            
            this.showError(error.message);
        });
    },
    
    checkForActiveChatRedirect() {
        
        const mentorId = sessionStorage.getItem('activeChatMentorId');
        const mentorName = sessionStorage.getItem('activeChatMentorName');
        
        if (mentorId && mentorName && this.currentUserId) {
            console.log(`Starting conversation with ${mentorName} (${mentorId})`);
            
            
            this.loadOrCreateConversation(this.currentUserId, mentorId, mentorName);
            
            
            sessionStorage.removeItem('activeChatMentorId');
            sessionStorage.removeItem('activeChatMentorName');
        }
    },
    
    loadOrCreateConversation(userId, otherUserId, otherUserName) {
        console.log(`Loading or creating conversation with ${otherUserName} (${otherUserId})`);
        
        
        const userIds = [userId, otherUserId].sort();
        const conversationId = `${userIds[0]}_${userIds[1]}`;
        
        
        const chatHeader = document.querySelector('.chat-header h2');
        if (chatHeader) {
            chatHeader.textContent = otherUserName;
        }
        
        
        this.currentConversation = conversationId;
        
        
        if (window.socketClient && window.socketClient.connected) {
            window.socketClient.getMessages(conversationId);
            
            
            const conversationElement = this.conversationsList?.querySelector(`[data-conversation-id="${conversationId}"]`);
            if (conversationElement) {
                
                const allConversations = this.conversationsList.querySelectorAll('.conversation-item');
                allConversations.forEach(conv => conv.classList.remove('active'));
                
                
                conversationElement.classList.add('active');
            } else {
                
                
                if (this.conversationsList) {
                    const newConversationElement = document.createElement('div');
                    newConversationElement.className = 'conversation-item active';
                    newConversationElement.dataset.conversationId = conversationId;
                    newConversationElement.dataset.userId = otherUserId;
                    
                    newConversationElement.innerHTML = `
                        <div class="conversation-avatar"></div>
                        <div class="conversation-info">
                            <div class="conversation-name">${otherUserName}</div>
                            <div class="conversation-preview">No messages yet</div>
                        </div>
                        <div class="conversation-meta">
                            <span class="status-indicator offline"></span>
                        </div>
                    `;
                    
                    
                    newConversationElement.addEventListener('click', () => {
                        this.loadConversation(conversationId);
                    });
                    
                    
                    this.conversationsList.prepend(newConversationElement);
                }
            }
        }
        
        
        if (this.messageContainer) {
            this.messageContainer.innerHTML = '';
        }
        
        
        if (this.messageInput) {
            this.messageInput.focus();
        }
    },
    
    sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content) return;
        
        
        if (!this.currentConversation) {
            console.error('No conversation selected');
            this.showError('Please select a conversation first');
            return;
        }
        
        
        if (window.socketClient.sendMessage(this.currentConversation, this.currentUserId, content)) {
            
            this.addMessage({
                content,
                sender: {
                    _id: this.currentUserId,
                    firstName: 'You',
                    lastName: '',
                    profileImage: ''
                },
                timestamp: new Date(),
                isRead: false
            });
            
            
            this.messageInput.value = '';
            
            
            this.scrollToBottom();
        }
    },
    
    addMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender._id === this.currentUserId ? 'sent' : 'received'}`;
        messageElement.dataset.timestamp = message.timestamp;
        messageElement.dataset.senderId = message.sender._id;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = `
            <div class="message-header">
                <span class="sender-name">${message.sender.firstName} ${message.sender.lastName}</span>
                <span class="timestamp">${this.formatTimestamp(message.timestamp)}</span>
            </div>
            <div class="message-text">${message.content}</div>
        `;
        
        messageElement.appendChild(messageContent);
        this.messageContainer.appendChild(messageElement);
    },
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    scrollToBottom() {
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    },
    
    loadConversations() {
        if (window.socketClient) {
            window.socketClient.getConversations();
        }
    },
    
    renderConversations(conversations) {
        if (!this.conversationsList) return;
        
        this.conversationsList.innerHTML = conversations.map(conv => `
            <div class="conversation-item" 
                 data-conversation-id="${conv.id}"
                 data-user-id="${conv.userId}">
                <div class="conversation-avatar">
                    ${conv.profileImage ? `<img src="${conv.profileImage}" alt="${conv.firstName} ${conv.lastName}">` : ''}
                </div>
                <div class="conversation-info">
                    <div class="conversation-name">
                        ${conv.isGroupChat ? conv.groupName : `${conv.firstName} ${conv.lastName}`}
                    </div>
                    <div class="conversation-preview">
                        ${conv.lastMessage || 'No messages yet'}
                    </div>
                </div>
                <div class="conversation-meta">
                    ${conv.unreadCount > 0 ? `<span class="unread-count">${conv.unreadCount}</span>` : ''}
                    <span class="status-indicator ${conv.online ? 'online' : 'offline'}"></span>
                </div>
            </div>
        `).join('');
    },
    
    loadConversation(conversationId) {
        this.currentConversation = conversationId;
        
        if (window.socketClient) {
            window.socketClient.getMessages(conversationId);
        }
    },
    
    renderMessages(messages) {
        if (!this.messageContainer) return;
        
        
        this.messageContainer.innerHTML = '';
        
        
        messages.forEach(msg => this.addMessage(msg));
        
        
        this.scrollToBottom();
    },
    
    markMessagesAsRead(conversationId) {
        if (window.socketClient) {
            window.socketClient.markMessagesAsRead(conversationId, this.currentUserId);
        }
    },
    
    showError(message) {
        
        console.error('Chat error:', message);
    }
};


window.addEventListener('load', () => {
    
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!currentUser || !currentUser.id) {
        
        window.location.href = 'login.html';
        return;
    }
    
    
    chat.init(currentUser.id);
});
