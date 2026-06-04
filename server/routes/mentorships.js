// Mentorship Routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Goal = require('../models/Goal');
const { matchUserWithMentors } = require('../utils/ai-helpers');

// @route   GET api/mentorships/mentors
// @desc    Get all mentors for a student
// @access  Private
router.get('/mentors', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (user.userType !== 'student') {
            return res.status(400).json({
                success: false,
                message: 'Only students can view their mentors'
            });
        }
        
        // Get user's mentors
        const mentors = await User.find({ 
            _id: { $in: user.mentors } 
        }).select('-password');
        
        res.json({
            success: true,
            mentors
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/mentorships/mentees
// @desc    Get all mentees for a mentor
// @access  Private
router.get('/mentees', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (user.userType !== 'mentor') {
            return res.status(400).json({
                success: false,
                message: 'Only mentors can view their mentees'
            });
        }
        
        // Get user's mentees
        const mentees = await User.find({ 
            _id: { $in: user.mentees } 
        }).select('-password');
        
        res.json({
            success: true,
            mentees
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/mentorships/request/:id
// @desc    Request mentorship from a mentor
// @access  Private
router.post('/request/:id', auth, async (req, res) => {
    try {
        const student = await User.findById(req.user.id);
        const mentor = await User.findById(req.params.id);
        
        if (!student || !mentor) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (student.userType !== 'student') {
            return res.status(400).json({
                success: false,
                message: 'Only students can request mentorship'
            });
        }
        
        if (mentor.userType !== 'mentor') {
            return res.status(400).json({
                success: false,
                message: 'Can only request mentorship from mentors'
            });
        }
        
        // Check if already connected
        if (student.mentors.includes(mentor._id)) {
            return res.status(400).json({
                success: false,
                message: 'Already connected with this mentor'
            });
        }
        
        // In a real app, this would send a request notification to the mentor
        // For prototype, auto-accept connection
        student.mentors.push(mentor._id);
        await student.save();
        
        mentor.mentees.push(student._id);
        await mentor.save();
        
        res.json({
            success: true,
            message: 'Mentorship connection established'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE api/mentorships/disconnect/:id
// @desc    End mentorship relationship
// @access  Private
router.delete('/disconnect/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const otherUser = await User.findById(req.params.id);
        
        if (!user || !otherUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check relationship type
        if (user.userType === 'student' && otherUser.userType === 'mentor') {
            // Remove mentor from student's mentors
            user.mentors = user.mentors.filter(id => id.toString() !== req.params.id);
            await user.save();
            
            // Remove student from mentor's mentees
            otherUser.mentees = otherUser.mentees.filter(id => id.toString() !== req.user.id);
            await otherUser.save();
        } else if (user.userType === 'mentor' && otherUser.userType === 'student') {
            // Remove student from mentor's mentees
            user.mentees = user.mentees.filter(id => id.toString() !== req.params.id);
            await user.save();
            
            // Remove mentor from student's mentors
            otherUser.mentors = otherUser.mentors.filter(id => id.toString() !== req.user.id);
            await otherUser.save();
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid mentorship relationship'
            });
        }
        
        res.json({
            success: true,
            message: 'Mentorship relationship ended'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/mentorships/recommended
// @desc    Get AI-recommended mentors
// @access  Private
router.get('/recommended', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (user.userType !== 'student') {
            return res.status(400).json({
                success: false,
                message: 'Only students can receive mentor recommendations'
            });
        }
        
        // Get all available mentors (excluding those already connected)
        const availableMentors = await User.find({ 
            userType: 'mentor',
            isProfileComplete: true,
            _id: { $nin: user.mentors }
        }).select('-password');
        
        // Use AI to match mentors with the user
        const recommendedMentors = await matchUserWithMentors(user, availableMentors);
        
        res.json({
            success: true,
            recommendations: recommendedMentors
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/mentorships/sessions
// @desc    Get upcoming mentorship sessions
// @access  Private
router.get('/sessions', auth, async (req, res) => {
    // In a real app, this would fetch scheduled sessions
    // For prototype, return mock data
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Mock data for prototype
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        
        // Get connected users (mentors or mentees)
        let connectedUsers = [];
        if (user.userType === 'student') {
            connectedUsers = await User.find({ _id: { $in: user.mentors } })
                .select('firstName lastName profileImage');
        } else {
            connectedUsers = await User.find({ _id: { $in: user.mentees } })
                .select('firstName lastName profileImage');
        }
        
        // Generate mock sessions
        const sessions = connectedUsers.map((otherUser, index) => {
            return {
                id: `session-${index}`,
                title: `Career Discussion with ${otherUser.firstName}`,
                description: 'Review career goals and discuss next steps',
                date: new Date(now.getTime() + ((index + 1) * oneDay)),
                duration: 30, // minutes
                participant: {
                    id: otherUser._id,
                    name: `${otherUser.firstName} ${otherUser.lastName}`,
                    profileImage: otherUser.profileImage
                },
                status: 'upcoming',
                joinUrl: '#',
                createdAt: new Date(now.getTime() - (oneDay * 2))
            };
        });
        
        res.json({
            success: true,
            sessions
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
