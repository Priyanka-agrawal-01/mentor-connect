// Community Routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Community = require('../models/Community');
const { spamDetection } = require('../utils/ai-helpers');

// @route   GET api/communities
// @desc    Get all communities
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { type, category } = req.query;
        
        // Build filter
        const filter = {};
        if (type) filter.type = type;
        if (category) filter.category = category;
        
        const communities = await Community.find(filter)
            .sort({ createdAt: -1 })
            .populate({
                path: 'members',
                select: 'firstName lastName profileImage',
                options: { limit: 5 }
            });
        
        res.json({
            success: true,
            communities
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/communities
// @desc    Create a new community
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const {
            name,
            description,
            type,
            category,
            coverImage,
            isPublic
        } = req.body;
        
        // Create new community
        const newCommunity = new Community({
            name,
            description,
            type,
            category,
            members: [req.user.id],
            moderators: [req.user.id]
        });
        
        if (coverImage) newCommunity.coverImage = coverImage;
        if (typeof isPublic !== 'undefined') newCommunity.isPublic = isPublic;
        
        await newCommunity.save();
        
        // Add community to user's communities
        await User.findByIdAndUpdate(
            req.user.id,
            { $push: { communities: newCommunity._id } }
        );
        
        // Populate creator info
        await newCommunity.populate({
            path: 'members',
            select: 'firstName lastName profileImage'
        });
        
        res.json({
            success: true,
            community: newCommunity
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/communities/:id
// @desc    Get a specific community
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id)
            .populate({
                path: 'members',
                select: 'firstName lastName profileImage batch branch'
            })
            .populate({
                path: 'moderators',
                select: 'firstName lastName profileImage'
            });
        
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }
        
        // If community is not public, check if user is a member
        if (!community.isPublic && !community.members.some(member => 
            member._id.toString() === req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You must be a member to view this community'
            });
        }
        
        res.json({
            success: true,
            community
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/communities/:id/join
// @desc    Join a community
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }
        
        // Check if already a member
        if (community.members.includes(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'Already a member of this community'
            });
        }
        
        // Add user to community members
        community.members.push(req.user.id);
        await community.save();
        
        // Add community to user's communities
        await User.findByIdAndUpdate(
            req.user.id,
            { $push: { communities: community._id } }
        );
        
        res.json({
            success: true,
            message: 'Joined community successfully'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/communities/:id/leave
// @desc    Leave a community
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }
        
        // Check if a member
        if (!community.members.includes(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'Not a member of this community'
            });
        }
        
        // Remove user from community members
        community.members = community.members.filter(member => 
            member.toString() !== req.user.id);
            
        // If user is a moderator, remove from moderators too
        if (community.moderators.includes(req.user.id)) {
            community.moderators = community.moderators.filter(mod => 
                mod.toString() !== req.user.id);
        }
        
        await community.save();
        
        // Remove community from user's communities
        await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { communities: community._id } }
        );
        
        res.json({
            success: true,
            message: 'Left community successfully'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/communities/:id/message
// @desc    Post a message to a community
// @access  Private
router.post('/:id/message', auth, async (req, res) => {
    try {
        const { content, attachments } = req.body;
        
        const community = await Community.findById(req.params.id);
        
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }
        
        // Check if user is a member
        if (!community.members.includes(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You must be a member to post messages'
            });
        }
        
        // Check for spam/inappropriate content
        const isSpam = await spamDetection(content);
        
        if (isSpam) {
            return res.status(400).json({
                success: false,
                message: 'Message contains inappropriate content and was not sent'
            });
        }
        
        // Create new message
        const newMessage = {
            user: req.user.id,
            content,
            timestamp: Date.now(),
            attachments: attachments || []
        };
        
        // Add message to community
        community.messages.push(newMessage);
        community.updatedAt = Date.now();
        
        await community.save();
        
        // Populate user info for the new message
        const populatedCommunity = await Community.findById(req.params.id);
        const addedMessage = populatedCommunity.messages[populatedCommunity.messages.length - 1];
        
        await populatedCommunity.populate({
            path: 'messages.user',
            select: 'firstName lastName profileImage',
            match: { _id: addedMessage.user }
        });
        
        res.json({
            success: true,
            message: populatedCommunity.messages[populatedCommunity.messages.length - 1]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/communities/:id/messages
// @desc    Get messages from a community
// @access  Private
router.get('/:id/messages', auth, async (req, res) => {
    try {
        const { limit = 50, before } = req.query;
        
        const community = await Community.findById(req.params.id);
        
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }
        
        // Check if user is a member
        if (!community.members.includes(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You must be a member to view messages'
            });
        }
        
        // Get messages with pagination
        let messages = [...community.messages];
        
        // If 'before' timestamp is provided, filter messages
        if (before) {
            messages = messages.filter(msg => 
                new Date(msg.timestamp) < new Date(before));
        }
        
        // Sort by timestamp (newest last)
        messages.sort((a, b) => a.timestamp - b.timestamp);
        
        // Limit the number of messages
        if (messages.length > limit) {
            messages = messages.slice(messages.length - limit);
        }
        
        // Populate user info for messages
        await community.populate({
            path: 'messages.user',
            select: 'firstName lastName profileImage'
        });
        
        res.json({
            success: true,
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

// @route   POST api/communities/seed
// @desc    Seed default communities
// @access  Private
router.post('/seed', auth, async (req, res) => {
    try {
        // In a real app, this would be admin-only
        // For prototype, any authenticated user can trigger this
        
        // Check if communities already exist
        const existingCommunities = await Community.countDocuments();
        
        if (existingCommunities > 0) {
            return res.status(400).json({
                success: false,
                message: 'Communities already seeded'
            });
        }
        
        // Default communities
        const defaultCommunities = [
            // General community for all
            {
                name: 'All Alumni & Students',
                description: 'A community for all alumni and students to connect and share experiences.',
                type: 'general',
                category: 'all',
                isPublic: true,
                members: [req.user.id],
                moderators: [req.user.id]
            },
            
            // Branch-based communities
            {
                name: 'Computer Science',
                description: 'Community for Computer Science students and alumni.',
                type: 'branch',
                category: 'Computer Science',
                isPublic: true,
                members: [req.user.id],
                moderators: [req.user.id]
            },
            {
                name: 'Electrical Engineering',
                description: 'Community for Electrical Engineering students and alumni.',
                type: 'branch',
                category: 'Electrical Engineering',
                isPublic: true,
                members: [req.user.id],
                moderators: [req.user.id]
            },
            {
                name: 'Mechanical Engineering',
                description: 'Community for Mechanical Engineering students and alumni.',
                type: 'branch',
                category: 'Mechanical Engineering',
                isPublic: true,
                members: [req.user.id],
                moderators: [req.user.id]
            },
            
            // Batch-based communities
            {
                name: 'Class of 2023',
                description: 'Community for the graduating class of 2023.',
                type: 'batch',
                category: '2023',
                isPublic: true,
                members: [req.user.id],
                moderators: [req.user.id]
            },
            {
                name: 'Class of 2022',
                description: 'Community for the graduating class of 2022.',
                type: 'batch',
                category: '2022',
                isPublic: true,
                members: [req.user.id],
                moderators: [req.user.id]
            },
            
            // Interest-based communities
            {
                name: 'Artificial Intelligence',
                description: 'Community for those interested in AI and machine learning.',
                type: 'interest',
                category: 'Artificial Intelligence',
                isPublic: true,
                members: [req.user.id],
                moderators: [req.user.id]
            },
            {
                name: 'Web Development',
                description: 'Community for web developers and enthusiasts.',
                type: 'interest',
                category: 'Web Development',
                isPublic: true,
                members: [req.user.id],
                moderators: [req.user.id]
            },
            {
                name: 'Entrepreneurship',
                description: 'Community for aspiring entrepreneurs and startup enthusiasts.',
                type: 'interest',
                category: 'Entrepreneurship',
                isPublic: true,
                members: [req.user.id],
                moderators: [req.user.id]
            }
        ];
        
        // Insert communities
        await Community.insertMany(defaultCommunities);
        
        // Add all communities to the user's communities
        const communities = await Community.find();
        
        await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { communities: { $each: communities.map(c => c._id) } } }
        );
        
        res.json({
            success: true,
            message: 'Default communities seeded successfully',
            count: defaultCommunities.length
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
