// MentorConnect - Socket.io Client
class SocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.eventHandlers = {};
        this.messageQueue = [];
        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryDelay = 1000; // Start with 1s delay
        
        // Initialize connection status indicator in UI if element exists
        this.initStatusIndicator();
    }
    
    // Initialize connection status indicator
    initStatusIndicator() {
        const indicator = document.getElementById('connection-status');
        if (indicator) {
            indicator.innerHTML = '<span class="text-warning">Disconnected</span>';
        }
    }
    
    // Update connection status indicator
    updateStatusIndicator(status) {
        const indicator = document.getElementById('connection-status');
        if (!indicator) return;
        
        if (status === 'connected') {
            indicator.innerHTML = '<span class="text-success">Connected</span>';
        } else if (status === 'disconnected') {
            indicator.innerHTML = '<span class="text-warning">Disconnected</span>';
        } else if (status === 'connecting') {
            indicator.innerHTML = '<span class="text-primary">Connecting...</span>';
        } else if (status === 'error') {
            indicator.innerHTML = '<span class="text-danger">Connection Error</span>';
        }
    }
    
    // Connect to socket server
    connect(userId) {
        if (!userId) {
            console.error('Cannot connect without a user ID');
            return false;
        }
        
        // Store user ID for reconnection
        this.userId = userId;
        
        if (this.socket && this.connected) {
            console.log('Already connected to socket server');
            return true;
        }
        
        // Determine server URL based on current window location
        let serverUrl;
        const hostname = window.location.hostname;
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // For local development
            serverUrl = `${protocol}//${hostname}:5000`;
        } else {
            // For production
            serverUrl = `${protocol}//${hostname}`;
        }
        
        console.log(`Connecting to socket server at ${serverUrl}`);
        this.updateStatusIndicator('connecting');
        
        // Initialize socket connection
        this.socket = io(serverUrl, {
            reconnection: true,
            reconnectionAttempts: this.maxRetries,
            reconnectionDelay: this.retryDelay,
            autoConnect: false
        });
        
        // Handle connection events
        this.socket.on('connect', () => {
            console.log('Connected to socket server');
            this.connected = true;
            this.retryCount = 0;
            this.updateStatusIndicator('connected');
            
            // Join user rooms
            this.joinUserRooms(this.userId);
            
            // Process any queued messages
            this.processMessageQueue();
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
            this.connected = false;
            this.updateStatusIndicator('disconnected');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.updateStatusIndicator('error');
            
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Retrying connection in ${this.retryDelay}ms...`);
                setTimeout(() => {
                    this.socket.connect();
                }, this.retryDelay);
                
                // Increase delay for next retry
                this.retryDelay = Math.min(this.retryDelay * 2, 30000); // Max 30s
            }
        });
        
        // Register event handlers
        this.registerEventHandlers(userId);
        
        // Connect immediately
        this.socket.connect();
        
        return true;
    }
    
    // Event handlers for socket events
    registerEventHandlers(userId) {
        // Store event handlers that can be registered later if needed
        this.eventHandlers = {
            'new-message': [],
            'new-conversation': [],
            'user-status-change': [],
            'connection-request': [],
            'online-users-status': [],
            'conversations-list': [],
            'messages-list': [],
            'message-sent': [],
            'messages-read': [],
            'error': []
        };
    }
    
    // Send a message to a conversation
    sendMessage(conversationId, senderId, message) {
        if (!this.connected || !this.socket) {
            console.error('Cannot send message: Socket not connected');
            this.queueMessage('send-message', { conversationId, senderId, message });
            return false;
        }
        
        console.log(`Sending message to conversation ${conversationId}`);
        
        this.socket.emit('send-message', {
            conversationId,
            senderId,
            message,
            isNewConversation: !conversationId.includes('_')
        });
        
        return true;
    }
    
    // Create a new conversation
    createConversation(participants, isGroupChat = false, groupName = null) {
        if (!this.connected || !this.socket) {
            console.error('Cannot create conversation: Socket not connected');
            this.queueMessage('create-conversation', { participants, isGroupChat, groupName });
            return false;
        }
        
        console.log(`Creating conversation with participants: ${participants.join(', ')}`);
        
        this.socket.emit('create-conversation', {
            participants,
            isGroupChat,
            groupName
        });
        
        return true;
    }
    
    // Join user rooms on connection
    joinUserRooms(userId) {
        if (!this.connected || !this.socket) {
            console.error('Cannot join rooms: Socket not connected');
            return false;
        }
        
        console.log(`Joining rooms for user ${userId}`);
        
        this.socket.emit('join-user-rooms', { userId });
        
        return true;
    }
    
    // Get conversations for a user
    getConversations() {
        if (!this.connected || !this.socket) {
            console.error('Cannot get conversations: Socket not connected');
            this.queueMessage('get-conversations', { userId: this.userId });
            return false;
        }
        
        console.log(`Getting conversations for user ${this.userId}`);
        
        this.socket.emit('get-conversations', { userId: this.userId });
        
        return true;
    }
    
    // Get messages for a conversation
    getMessages(conversationId, limit = 50, before = null) {
        if (!this.connected || !this.socket) {
            console.error('Cannot get messages: Socket not connected');
            this.queueMessage('get-messages', { conversationId, limit, before });
            return false;
        }
        
        console.log(`Getting messages for conversation ${conversationId}`);
        
        this.socket.emit('get-messages', {
            conversationId,
            limit,
            before
        });
        
        return true;
    }
    
    // Mark messages as read
    markMessagesAsRead(conversationId, userId) {
        if (!this.connected || !this.socket) {
            console.error('Cannot mark messages as read: Socket not connected');
            this.queueMessage('mark-messages-read', { conversationId, userId });
            return false;
        }
        
        console.log(`Marking messages as read for conversation ${conversationId}`);
        
        this.socket.emit('mark-messages-read', {
            conversationId,
            userId
        });
        
        return true;
    }
    
    // Register an event handler
    on(event, callback) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        
        this.eventHandlers[event].push(callback);
        
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }
    
    // Process queued messages
    processMessageQueue() {
        if (this.messageQueue.length === 0) {
            return;
        }
        
        console.log(`Processing ${this.messageQueue.length} queued messages`);
        
        while (this.messageQueue.length > 0) {
            const { event, data } = this.messageQueue.shift();
            this.socket.emit(event, data);
        }
    }
    
    // Queue a message to be sent when connected
    queueMessage(event, data) {
        console.log(`Queuing ${event} message for later sending`);
        this.messageQueue.push({ event, data });
    }
    
    // Disconnect from socket server
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
            this.updateStatusIndicator('disconnected');
        }
    }
}

// Create global socketClient instance
window.socketClient = new SocketClient();
