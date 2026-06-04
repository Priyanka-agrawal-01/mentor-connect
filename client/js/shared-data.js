// MentorConnect - shared-data.js
// Simulates a shared database using localStorage for demo purposes and integrates with socket.io

// Initialize shared data store if not exists
function initSharedData() {
    if (!localStorage.getItem('mentorConnect_activeUsers')) {
        localStorage.setItem('mentorConnect_activeUsers', JSON.stringify({}));
    }
    
    if (!localStorage.getItem('mentorConnect_connectionRequests')) {
        localStorage.setItem('mentorConnect_connectionRequests', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('mentorConnect_chatMessages')) {
        localStorage.setItem('mentorConnect_chatMessages', JSON.stringify({}));
    }
    
    if (!localStorage.getItem('mentorConnect_lastActivity')) {
        localStorage.setItem('mentorConnect_lastActivity', JSON.stringify({}));
    }
    
    cleanupStaleUsers();
    console.log('Shared data initialized');
}

// Clean up stale users (inactive for more than 5 minutes)
function cleanupStaleUsers() {
    const lastActivity = JSON.parse(localStorage.getItem('mentorConnect_lastActivity') || '{}');
    const activeUsers = JSON.parse(localStorage.getItem('mentorConnect_activeUsers') || '{}');
    const now = Date.now();
    
    let changed = false;
    Object.keys(lastActivity).forEach(userId => {
        if (now - lastActivity[userId] > 5 * 60 * 1000) { // 5 minutes
            delete lastActivity[userId];
            delete activeUsers[userId];
            changed = true;
        }
    });
    
    if (changed) {
        localStorage.setItem('mentorConnect_lastActivity', JSON.stringify(lastActivity));
        localStorage.setItem('mentorConnect_activeUsers', JSON.stringify(activeUsers));
    }
}

// Set user as active
function setUserActive(user) {
    if (!user || !user.id) return;
    
    const activeUsers = JSON.parse(localStorage.getItem('mentorConnect_activeUsers') || '{}');
    const lastActivity = JSON.parse(localStorage.getItem('mentorConnect_lastActivity') || '{}');
    
    // Store minimal user data to avoid large localStorage items
    activeUsers[user.id] = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        profileImage: user.profileImage,
        status: 'online'
    };
    
    lastActivity[user.id] = Date.now();
    
    localStorage.setItem('mentorConnect_activeUsers', JSON.stringify(activeUsers));
    localStorage.setItem('mentorConnect_lastActivity', JSON.stringify(lastActivity));
    
    // Attempt to connect to socket server if available
    if (window.socketClient && !window.socketClient.connected) {
        console.log('Connecting to socket server from shared-data.js...');
        window.socketClient.connect(user.id);
    }
}

// Get all active users
function getActiveUsers() {
    cleanupStaleUsers();
    return JSON.parse(localStorage.getItem('mentorConnect_activeUsers') || '{}');
}

// Set user as inactive
function setUserInactive(userId) {
    if (!userId) return;
    
    const activeUsers = JSON.parse(localStorage.getItem('mentorConnect_activeUsers') || '{}');
    const lastActivity = JSON.parse(localStorage.getItem('mentorConnect_lastActivity') || '{}');
    
    delete activeUsers[userId];
    delete lastActivity[userId];
    
    localStorage.setItem('mentorConnect_activeUsers', JSON.stringify(activeUsers));
    localStorage.setItem('mentorConnect_lastActivity', JSON.stringify(lastActivity));
    
    // Disconnect from socket server if available
    if (window.socketClient && window.socketClient.connected) {
        window.socketClient.disconnect();
    }
}

// Send connection request
function sendConnectionRequest(fromUserId, toUserId) {
    if (!fromUserId || !toUserId) return false;
    
    // Try to send via socket first
    if (window.socketClient && window.socketClient.connected) {
        return window.socketClient.sendConnectionRequest(fromUserId, toUserId);
    }
    
    // Fallback to localStorage
    const requests = JSON.parse(localStorage.getItem('mentorConnect_connectionRequests') || '[]');
    
    // Check if request already exists
    const existingRequest = requests.find(req => 
        req.fromUserId === fromUserId && req.toUserId === toUserId);
    
    if (existingRequest) return false;
    
    // Add new request
    requests.push({
        id: Date.now().toString(),
        fromUserId,
        toUserId,
        status: 'pending',
        timestamp: Date.now()
    });
    
    localStorage.setItem('mentorConnect_connectionRequests', JSON.stringify(requests));
    return true;
}

// Get connection requests for user
function getConnectionRequests(userId) {
    if (!userId) return [];
    
    const requests = JSON.parse(localStorage.getItem('mentorConnect_connectionRequests') || '[]');
    return requests.filter(req => req.toUserId === userId && req.status === 'pending');
}

// Accept connection request
function acceptConnectionRequest(requestId, userId) {
    if (!requestId) return false;
    
    // Try to accept via socket first
    if (window.socketClient && window.socketClient.connected) {
        return window.socketClient.acceptConnectionRequest(requestId, userId);
    }
    
    // Fallback to localStorage
    const requests = JSON.parse(localStorage.getItem('mentorConnect_connectionRequests') || '[]');
    const requestIndex = requests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) return false;
    
    requests[requestIndex].status = 'accepted';
    localStorage.setItem('mentorConnect_connectionRequests', JSON.stringify(requests));
    return true;
}

// Decline connection request
function declineConnectionRequest(requestId, userId) {
    if (!requestId) return false;
    
    // Try to decline via socket first
    if (window.socketClient && window.socketClient.connected) {
        return window.socketClient.declineConnectionRequest(requestId, userId);
    }
    
    // Fallback to localStorage
    const requests = JSON.parse(localStorage.getItem('mentorConnect_connectionRequests') || '[]');
    const requestIndex = requests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) return false;
    
    requests[requestIndex].status = 'declined';
    localStorage.setItem('mentorConnect_connectionRequests', JSON.stringify(requests));
    return true;
}

// Send chat message
function sendChatMessage(fromUserId, toUserId, message) {
    if (!fromUserId || !toUserId || !message) return false;
    
    // Create conversation ID (always sort user IDs to ensure consistent ID)
    const participants = [fromUserId, toUserId].sort();
    const conversationId = participants.join('_');
    
    // Try to send via socket first
    if (window.socketClient && window.socketClient.connected) {
        console.log('Sending message via socket from shared-data.js');
        return window.socketClient.sendMessage(conversationId, fromUserId, message);
    }
    
    // Fallback to localStorage if socket is not available
    console.log('Socket not available, using localStorage for message');
    const chatMessages = JSON.parse(localStorage.getItem('mentorConnect_chatMessages') || '{}');
    
    // Initialize conversation if not exists
    if (!chatMessages[conversationId]) {
        chatMessages[conversationId] = [];
    }
    
    // Add message
    chatMessages[conversationId].push({
        id: Date.now().toString(),
        fromUserId,
        toUserId,
        message,
        timestamp: Date.now(),
        read: false
    });
    
    localStorage.setItem('mentorConnect_chatMessages', JSON.stringify(chatMessages));
    return true;
}

// Get chat messages for conversation
function getChatMessages(userId1, userId2) {
    if (!userId1 || !userId2) return [];
    
    const chatMessages = JSON.parse(localStorage.getItem('mentorConnect_chatMessages') || '{}');
    
    // Create conversation ID (always sort user IDs to ensure consistent ID)
    const participants = [userId1, userId2].sort();
    const conversationId = participants.join('_');
    
    return chatMessages[conversationId] || [];
}

// Mark messages as read
function markMessagesAsRead(fromUserId, toUserId) {
    if (!fromUserId || !toUserId) return false;
    
    const chatMessages = JSON.parse(localStorage.getItem('mentorConnect_chatMessages') || '{}');
    
    // Create conversation ID (always sort user IDs to ensure consistent ID)
    const participants = [fromUserId, toUserId].sort();
    const conversationId = participants.join('_');
    
    if (!chatMessages[conversationId]) return false;
    
    let changed = false;
    chatMessages[conversationId].forEach(msg => {
        if (msg.fromUserId === fromUserId && !msg.read) {
            msg.read = true;
            changed = true;
        }
    });
    
    if (changed) {
        localStorage.setItem('mentorConnect_chatMessages', JSON.stringify(chatMessages));
    }
    
    return changed;
}

// Get all conversations for a user
function getUserConversations(userId) {
    if (!userId) return [];
    
    const chatMessages = JSON.parse(localStorage.getItem('mentorConnect_chatMessages') || '{}');
    const activeUsers = getActiveUsers();
    const result = [];
    
    // Find all conversations that involve this user
    Object.keys(chatMessages).forEach(conversationId => {
        const participantIds = conversationId.split('_');
        
        if (participantIds.includes(userId)) {
            // Find the other participant
            const otherUserId = participantIds[0] === userId ? participantIds[1] : participantIds[0];
            
            // Get user details
            const otherUser = activeUsers[otherUserId] || { id: otherUserId, firstName: 'Unknown', lastName: 'User' };
            
            // Count unread messages
            const unreadCount = chatMessages[conversationId].filter(msg => 
                msg.fromUserId === otherUserId && !msg.read
            ).length;
            
            // Get last message
            const messages = chatMessages[conversationId];
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            
            result.push({
                id: conversationId,
                userId: otherUserId,
                firstName: otherUser.firstName,
                lastName: otherUser.lastName,
                profileImage: otherUser.profileImage,
                lastMessage: lastMessage ? lastMessage.message : '',
                lastMessageTime: lastMessage ? lastMessage.timestamp : 0,
                unreadCount: unreadCount,
                online: !!activeUsers[otherUserId]
            });
        }
    });
    
    // Sort by last message time (descending)
    return result.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
}

// Initialize mock users with consistent IDs if not exists
function initMockUsers() {
    if (!window.mockUsers) {
        window.mockUsers = [
            {
                id: 'user_123',
                firstName: 'Alex',
                lastName: 'Johnson',
                email: 'alex.johnson@example.com',
                userType: 'mentor',
                skills: ['JavaScript', 'React', 'Node.js'],
                interests: ['Web Development', 'AI', 'Mobile Development'],
                profileImage: 'https://randomuser.me/api/portraits/men/32.jpg'
            },
            {
                id: 'user_456',
                firstName: 'Sarah',
                lastName: 'Wilson',
                email: 'sarah.wilson@example.com',
                userType: 'mentor',
                skills: ['Python', 'Data Science', 'Machine Learning'],
                interests: ['AI', 'Big Data', 'Cloud Computing'],
                profileImage: 'https://randomuser.me/api/portraits/women/44.jpg'
            },
            {
                id: 'user_789',
                firstName: 'Michael',
                lastName: 'Brown',
                email: 'michael.brown@example.com',
                userType: 'mentor',
                skills: ['Java', 'Spring', 'Microservices'],
                interests: ['Backend Development', 'System Design', 'Cloud Architecture'],
                profileImage: 'https://randomuser.me/api/portraits/men/67.jpg'
            },
            {
                id: 'user_101112',
                firstName: 'Aditya',
                lastName: 'Sharma',
                email: 'aditya.sharma@example.com',
                userType: 'mentor',
                skills: ['Mobile Development', 'Flutter', 'React Native'],
                interests: ['UI/UX Design', 'Mobile Apps', 'Cross-platform Development'],
                profileImage: 'https://randomuser.me/api/portraits/men/76.jpg'
            },
            {
                id: 'user_131415',
                firstName: 'Emily',
                lastName: 'Roberts',
                email: 'emily.roberts@example.com',
                userType: 'mentor',
                skills: ['DevOps', 'AWS', 'Docker', 'Kubernetes'],
                interests: ['Cloud Computing', 'Infrastructure', 'Automation'],
                profileImage: 'https://randomuser.me/api/portraits/women/33.jpg'
            }
        ];
    }
}

// Get user data by ID
function getUserById(userId) {
    initMockUsers();
    
    // Check if it's one of our mock users
    const mockUser = window.mockUsers.find(user => user.id === userId);
    if (mockUser) {
        return mockUser;
    }
    
    // Otherwise, try to get from current user in sessionStorage
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (currentUser.id === userId) {
        return currentUser;
    }
    
    // Return a default user object if not found
    return {
        id: userId,
        firstName: 'Unknown',
        lastName: 'User',
        profileImage: ''
    };
}

// Initialize shared data when script loads
initSharedData();
initMockUsers();

// Make functions available globally
window.sharedData = {
    setUserActive,
    setUserInactive,
    getActiveUsers,
    sendConnectionRequest,
    getConnectionRequests,
    acceptConnectionRequest,
    declineConnectionRequest,
    sendChatMessage,
    getChatMessages,
    markMessagesAsRead,
    getUserConversations,
    getUserById
};
