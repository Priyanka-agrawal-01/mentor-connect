// MentorConnect - Socket.io Server
const socketIO = require('socket.io');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const mongoose = require('mongoose');

// Track active users
const onlineUsers = new Map();

function createSocketServer(server) {
    const io = socketIO(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    // Connection event
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);
        let currentUserId = null;

        // Join user rooms
        socket.on('join-user-rooms', async (data) => {
            const { userId } = data;
            
            if (!userId) {
                console.error('No user ID provided for room join');
                return;
            }
            
            console.log(`User ${userId} joining their room`);
            currentUserId = userId;
            
            // Track online status
            onlineUsers.set(userId, {
                socketId: socket.id,
                lastActive: new Date()
            });
            
            // Join a room specific to this user
            socket.join(`user:${userId}`);
            
            // Get user data from database
            try {
                const user = await User.findById(userId);
                if (user) {
                    // Find all conversations this user is part of
                    const conversations = await Conversation.find({
                        participants: userId
                    });
                    
                    // Join room for each conversation
                    conversations.forEach(conv => {
                        socket.join(`conversation:${conv._id}`);
                        console.log(`User ${userId} joined conversation:${conv._id}`);
                    });
                } else {
                    console.log(`User ${userId} not found in database`);
                }
            } catch (err) {
                console.error('Error finding user or conversations:', err);
            }
            
            // Broadcast user status change
            io.emit('user-status-change', {
                userId,
                status: 'online',
                timestamp: new Date()
            });
            
            // Send online users to the client
            socket.emit('get-online-users');
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            
            if (currentUserId) {
                // Remove from online users
                onlineUsers.delete(currentUserId);
                
                // Broadcast user status change
                io.emit('user-status-change', {
                    userId: currentUserId,
                    status: 'offline',
                    timestamp: new Date()
                });
            }
        });

        // Handle getting online users
        socket.on('get-online-users', (data) => {
            console.log('Get online users request received');
            const userIds = data?.userIds || [];
            const statuses = {};
            
            if (userIds.length > 0) {
                // Get status for specific users
                userIds.forEach(id => {
                    statuses[id] = onlineUsers.has(id) ? 'online' : 'offline';
                });
            } else {
                // Get all online users
                onlineUsers.forEach((value, key) => {
                    statuses[key] = 'online';
                });
            }
            
            console.log('Sending online users statuses:', statuses);
            socket.emit('online-users-status', statuses);
        });

        // Handle sending a message
        socket.on('send-message', async (data) => {
            try {
                const { conversationId, senderId, message, isNewConversation } = data;
                
                if (!conversationId || !senderId || !message) {
                    console.error('Missing required fields for sending message');
                    socket.emit('error', { message: 'Missing required fields' });
                    return;
                }
                
                console.log(`Processing message from ${senderId} in conversation ${conversationId}`);
                
                // Check if this is a new conversation format (user1_user2)
                let conversation;
                
                if (conversationId.includes('_') && isNewConversation) {
                    // This is a new conversation with the format userId1_userId2
                    const participantIds = conversationId.split('_');
                    
                    if (participantIds.length !== 2) {
                        socket.emit('error', { message: 'Invalid conversation ID format' });
                        return;
                    }
                    
                    // Check if a conversation already exists between these users
                    conversation = await Conversation.findOne({
                        participants: { $all: participantIds },
                        isGroupChat: false
                    });
                    
                    // If no conversation exists, create a new one
                    if (!conversation) {
                        console.log(`Creating new conversation between ${participantIds[0]} and ${participantIds[1]}`);
                        
                        conversation = new Conversation({
                            participants: participantIds,
                            isGroupChat: false,
                            createdBy: senderId,
                            unreadCounts: new Map()
                        });
                        
                        // Set initial unread counts
                        participantIds.forEach(userId => {
                            if (userId !== senderId) {
                                conversation.unreadCounts.set(userId, 1);
                            } else {
                                conversation.unreadCounts.set(userId, 0);
                            }
                        });
                        
                        await conversation.save();
                        
                        // Notify participants of the new conversation
                        participantIds.forEach(userId => {
                            if (userId !== senderId) {
                                const userSocketId = onlineUsers.get(userId);
                                if (userSocketId) {
                                    io.to(`user:${userId}`).emit('new-conversation', {
                                        conversationId: conversation._id,
                                        participants: participantIds
                                    });
                                }
                            }
                        });
                    }
                } else {
                    // Find existing conversation
                    conversation = await Conversation.findById(conversationId);
                    
                    if (!conversation) {
                        socket.emit('error', { message: 'Conversation not found' });
                        return;
                    }
                }
                
                // Create and save the new message
                const newMessage = new Message({
                    conversation: conversation._id,
                    sender: senderId,
                    content: message,
                    timestamp: new Date()
                });
                
                await newMessage.save();
                
                // Update the conversation's last message and timestamp
                conversation.lastMessage = newMessage._id;
                conversation.updatedAt = new Date();
                
                // Increment unread count for all participants except sender
                conversation.participants.forEach(participantId => {
                    if (participantId.toString() !== senderId) {
                        const currentCount = conversation.unreadCounts.get(participantId.toString()) || 0;
                        conversation.unreadCounts.set(participantId.toString(), currentCount + 1);
                    }
                });
                
                await conversation.save();
                
                // Populate sender info for the message
                await newMessage.populate('sender', 'firstName lastName profileImage');
                
                // Send the message to all participants
                conversation.participants.forEach(participantId => {
                    const userSocketId = onlineUsers.get(participantId.toString());
                    if (userSocketId) {
                        io.to(`user:${participantId}`).emit('new-message', {
                            conversationId: conversation._id,
                            message: {
                                _id: newMessage._id,
                                content: newMessage.content,
                                sender: newMessage.sender,
                                timestamp: newMessage.timestamp,
                                isRead: participantId.toString() === senderId
                            }
                        });
                    }
                });
                
                // Send confirmation to sender
                socket.emit('message-sent', {
                    conversationId: conversation._id,
                    messageId: newMessage._id,
                    timestamp: newMessage.timestamp
                });
                
                console.log(`Message sent successfully to conversation ${conversation._id}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Error sending message', details: error.message });
            }
        });

        // Handle marking messages as read
        socket.on('mark-messages-read', async (data) => {
            try {
                const { conversationId, userId } = data;
                
                if (!conversationId || !userId) {
                    console.error('Missing required fields for marking messages as read:', data);
                    socket.emit('error', { message: 'Missing required fields' });
                    return;
                }
                
                console.log(`Marking messages as read in conversation ${conversationId} for user ${userId}`);
                
                // Find the conversation
                const conversation = await Conversation.findById(conversationId);
                if (!conversation) {
                    console.error(`Conversation ${conversationId} not found`);
                    socket.emit('error', { message: 'Conversation not found' });
                    return;
                }
                
                // Find all unread messages in this conversation not sent by the user
                const messages = await Message.find({
                    conversation: conversationId,
                    sender: { $ne: userId },
                    'readBy.user': { $ne: userId },
                    isRead: false
                });
                
                if (messages.length === 0) {
                    console.log('No unread messages to mark as read');
                    return;
                }
                
                console.log(`Marking ${messages.length} messages as read`);
                
                // Update each message
                for (const message of messages) {
                    message.readBy.push({
                        user: userId,
                        readAt: new Date()
                    });
                    
                    // Check if all participants have read the message
                    const hasAllParticipantsRead = conversation.participants.every(participantId => {
                        // Skip the sender
                        if (participantId.toString() === message.sender.toString()) {
                            return true;
                        }
                        
                        // Check if this participant has read the message
                        return message.readBy.some(readInfo => 
                            readInfo.user.toString() === participantId.toString()
                        );
                    });
                    
                    if (hasAllParticipantsRead) {
                        message.isRead = true;
                    }
                    
                    await message.save();
                }
                
                // Reset unread count for this user in the conversation
                conversation.unreadCounts.set(userId, 0);
                await conversation.save();
                
                // Emit messages read event
                io.to(`conversation:${conversation._id}`).emit('messages-read', {
                    conversationId,
                    userId,
                    timestamp: new Date()
                });
                
                // Send confirmation back to the client
                socket.emit('messages-read-confirmation', {
                    success: true,
                    conversationId
                });
            } catch (error) {
                console.error('Error marking messages as read:', error);
                socket.emit('error', { message: 'Error marking messages as read', details: error.message });
            }
        });

        // Handle getting user conversations
        socket.on('get-conversations', async (data) => {
            try {
                const { userId } = data;
                
                if (!userId) {
                    console.error('Missing user ID for getting conversations');
                    socket.emit('error', { message: 'Missing user ID' });
                    return;
                }
                
                console.log(`Getting conversations for user ${userId}`);
                
                // Find all conversations this user is part of
                const conversations = await Conversation.find({
                    participants: userId
                })
                .populate('participants', 'firstName lastName profileImage')
                .populate('lastMessage')
                .sort({ updatedAt: -1 });
                
                if (conversations.length === 0) {
                    console.log(`No conversations found for user ${userId}`);
                    socket.emit('conversations-list', []);
                    return;
                }
                
                console.log(`Found ${conversations.length} conversations for user ${userId}`);
                
                // Format conversations for client
                const formattedConversations = conversations.map(conv => {
                    // Get the other participant(s) in the conversation
                    const otherParticipants = conv.participants.filter(
                        p => p._id.toString() !== userId
                    );
                    
                    // For 1-on-1 chats, use the other user's info
                    const otherUser = otherParticipants[0] || {};
                    
                    // Get conversation name (group name or other user's name)
                    const name = conv.isGroupChat 
                        ? conv.name 
                        : `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim();
                    
                    // Get unread count for this user
                    const unreadCount = conv.unreadCounts.get(userId) || 0;
                    
                    // Last message content
                    const lastMessage = conv.lastMessage 
                        ? conv.lastMessage.content
                        : null;
                    
                    // Last message time
                    const lastMessageTime = conv.lastMessage 
                        ? conv.lastMessage.timestamp
                        : conv.updatedAt;
                    
                    // Check if the other user is online
                    const isOtherUserOnline = !conv.isGroupChat && otherUser._id
                        ? onlineUsers.has(otherUser._id.toString())
                        : false;
                    
                    return {
                        id: conv._id,
                        userId: otherUser._id?.toString(),
                        firstName: otherUser.firstName || 'Unknown',
                        lastName: otherUser.lastName || 'User',
                        profileImage: otherUser.profileImage,
                        isGroupChat: conv.isGroupChat,
                        groupName: conv.name,
                        lastMessage,
                        lastMessageTime,
                        unreadCount,
                        online: isOtherUserOnline,
                        updatedAt: conv.updatedAt
                    };
                });
                
                // Send conversations to client
                socket.emit('conversations-list', formattedConversations);
            } catch (error) {
                console.error('Error getting conversations:', error);
                socket.emit('error', { message: 'Error getting conversations', details: error.message });
            }
        });

        // Handle getting messages for a conversation
        socket.on('get-messages', async (data) => {
            try {
                const { conversationId, limit = 50, before = null } = data;
                
                if (!conversationId) {
                    console.error('Missing conversation ID for getting messages');
                    socket.emit('error', { message: 'Missing conversation ID' });
                    return;
                }
                
                console.log(`Getting messages for conversation ${conversationId}`);
                
                // Create query object
                let query = { conversation: conversationId };
                
                // Add date filter if 'before' is provided
                if (before) {
                    query.timestamp = { $lt: new Date(before) };
                }
                
                // Find messages
                const messages = await Message.find(query)
                    .populate('sender', 'firstName lastName profileImage')
                    .sort({ timestamp: -1 })
                    .limit(limit);
                
                console.log(`Found ${messages.length} messages for conversation ${conversationId}`);
                
                // Send messages to client
                socket.emit('messages-list', {
                    conversationId,
                    messages: messages.reverse() // Send in chronological order
                });
            } catch (error) {
                console.error('Error getting messages:', error);
                socket.emit('error', { message: 'Error getting messages', details: error.message });
            }
        });
    });

    return io;
}

module.exports = createSocketServer;
