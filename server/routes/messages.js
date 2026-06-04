// Message Routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { spamDetection, generateAIChatResponse } = require('../utils/ai-helpers');

// @route   GET api/messages/conversations
// @desc    Get all conversations for a user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
    try {
        // Find conversations where the user is a participant
        const conversations = await Conversation.find({
            participants: req.user.id
        })
        .populate({
            path: 'participants',
            select: 'firstName lastName profileImage'
        })
        .populate({
            path: 'lastMessage',
            select: 'content sender timestamp'
        })
        .sort({ updatedAt: -1 });
        
        res.json({
            success: true,
            conversations
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/messages/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/conversations', auth, async (req, res) => {
    try {
        const { participantId, isGroupChat, name } = req.body;
        
        // Check if participant exists
        if (participantId) {
            const participant = await User.findById(participantId);
            
            if (!participant) {
                return res.status(404).json({
                    success: false,
                    message: 'Participant not found'
                });
            }
        }
        
        // Check if one-on-one conversation already exists
        if (participantId && !isGroupChat) {
            const existingConversation = await Conversation.findOne({
                isGroupChat: false,
                participants: { $all: [req.user.id, participantId] }
            });
            
            if (existingConversation) {
                return res.json({
                    success: true,
                    conversation: existingConversation
                });
            }
        }
        
        // Create new conversation
        const newConversation = new Conversation({
            participants: isGroupChat 
                ? [req.user.id, ...req.body.participants] 
                : [req.user.id, participantId],
            isGroupChat: isGroupChat || false,
            name: name || null
        });
        
        await newConversation.save();
        
        // Add conversation to users' conversations array
        await User.updateMany(
            { _id: { $in: newConversation.participants } },
            { $push: { conversations: newConversation._id } }
        );
        
        // Populate participants
        await newConversation.populate({
            path: 'participants',
            select: 'firstName lastName profileImage'
        });
        
        res.json({
            success: true,
            conversation: newConversation
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/messages/conversations/:id
// @desc    Get messages for a specific conversation
// @access  Private
router.get('/conversations/:id', auth, async (req, res) => {
    try {
        // Check if conversation exists and user is a participant
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            participants: req.user.id
        });
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found or unauthorized'
            });
        }
        
        // Get messages for this conversation
        const messages = await Message.find({
            conversation: req.params.id
        })
        .populate({
            path: 'sender',
            select: 'firstName lastName profileImage'
        })
        .sort({ timestamp: 1 });
        
        res.json({
            success: true,
            conversation,
            messages
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/messages/conversations/:id
// @desc    Send a message in a conversation
// @access  Private
router.post('/conversations/:id', auth, async (req, res) => {
    try {
        const { content } = req.body;
        
        // Check if conversation exists and user is a participant
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            participants: req.user.id
        });
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found or unauthorized'
            });
        }
        
        // Check for spam/inappropriate content
        const isSpam = await spamDetection(content);
        
        if (isSpam) {
            return res.status(400).json({
                success: false,
                message: 'Message contains inappropriate content and was not sent.'
            });
        }
        
        // Create new message
        const newMessage = new Message({
            conversation: req.params.id,
            sender: req.user.id,
            content,
            timestamp: Date.now()
        });
        
        await newMessage.save();
        
        // Update conversation with last message
        conversation.lastMessage = newMessage._id;
        conversation.updatedAt = Date.now();
        
        // Reset unread count for the sender
        const unreadCounts = { ...conversation.unreadCounts.toObject() };
        unreadCounts[req.user.id] = 0;
        
        // Increment unread count for all other participants
        conversation.participants.forEach(participant => {
            if (participant.toString() !== req.user.id) {
                const currentCount = unreadCounts[participant] || 0;
                unreadCounts[participant] = currentCount + 1;
            }
        });
        
        conversation.unreadCounts = unreadCounts;
        await conversation.save();
        
        // Populate sender info
        await newMessage.populate({
            path: 'sender',
            select: 'firstName lastName profileImage'
        });
        
        res.json({
            success: true,
            message: newMessage
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/messages/ai-assistant
// @desc    Get response from AI assistant
// @access  Private
router.post('/ai-assistant', auth, async (req, res) => {
    try {
        const { query } = req.body;
        
        // Get user data for context
        const user = await User.findById(req.user.id)
            .select('firstName skills interests careerGoals');
        
        // Generate AI response
        const response = await generateAIChatResponse(query, user);
        
        res.json({
            success: true,
            response
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT api/messages/read/:conversationId
// @desc    Mark messages as read in a conversation
// @access  Private
router.put('/read/:conversationId', auth, async (req, res) => {
    try {
        // Check if conversation exists and user is a participant
        const conversation = await Conversation.findOne({
            _id: req.params.conversationId,
            participants: req.user.id
        });
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found or unauthorized'
            });
        }
        
        // Update unread count for the user
        const unreadCounts = { ...conversation.unreadCounts.toObject() };
        unreadCounts[req.user.id] = 0;
        conversation.unreadCounts = unreadCounts;
        
        await conversation.save();
        
        // Mark messages as read
        await Message.updateMany(
            {
                conversation: req.params.conversationId,
                sender: { $ne: req.user.id },
                'readBy.user': { $ne: req.user.id }
            },
            {
                $push: {
                    readBy: {
                        user: req.user.id,
                        readAt: Date.now()
                    }
                },
                $set: { isRead: true }
            }
        );
        
        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
