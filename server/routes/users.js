// User Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { matchUserWithMentors } = require('../utils/ai-helpers');

// @route   GET api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('badges')
            .populate('goals')
            .populate({
                path: 'mentors',
                select: 'firstName lastName profileImage skills interests'
            })
            .populate({
                path: 'mentees',
                select: 'firstName lastName profileImage skills interests'
            });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            profile: user
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            skills,
            interests,
            careerGoals,
            bio,
            education,
            experience
        } = req.body;
        
        // Build profile object
        const profileFields = {};
        if (firstName) profileFields.firstName = firstName;
        if (lastName) profileFields.lastName = lastName;
        if (skills) profileFields.skills = skills;
        if (interests) profileFields.interests = interests;
        if (careerGoals) profileFields.careerGoals = careerGoals;
        if (bio) profileFields.bio = bio;
        if (education) profileFields.education = education;
        if (experience) profileFields.experience = experience;
        
        // Check if profile is complete
        const isComplete = 
            profileFields.firstName && 
            profileFields.lastName && 
            (profileFields.skills && profileFields.skills.length > 0) && 
            (profileFields.interests && profileFields.interests.length > 0) && 
            (profileFields.careerGoals && profileFields.careerGoals.length > 0) && 
            profileFields.bio;
            
        if (isComplete) {
            profileFields.isProfileComplete = true;
        }
        
        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true }
        ).select('-password');
        
        res.json({
            success: true,
            profile: updatedUser
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/users/mentors
// @desc    Get recommended mentors for the current user
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
                message: 'Only students can view mentor recommendations'
            });
        }
        
        // Get all mentors
        const mentors = await User.find({ 
            userType: 'mentor',
            isProfileComplete: true,
            _id: { $nin: user.mentors } // Exclude existing mentors
        }).select('firstName lastName profileImage skills interests careerGoals bio');
        
        // Use AI to match mentors with the user
        const matchedMentors = await matchUserWithMentors(user, mentors);
        
        res.json({
            success: true,
            mentors: matchedMentors
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/users/connect/:id
// @desc    Send connection request to a mentor
// @access  Private
router.post('/connect/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const mentor = await User.findById(req.params.id);
        
        if (!user || !mentor) {
            return res.status(404).json({
                success: false,
                message: 'User or mentor not found'
            });
        }
        
        if (mentor.userType !== 'mentor') {
            return res.status(400).json({
                success: false,
                message: 'Can only connect with mentors'
            });
        }
        
        // Check if already connected
        if (user.mentors.includes(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Already connected with this mentor'
            });
        }
        
        // In a real app, this would send a connection request
        // For this prototype, we'll auto-accept
        user.mentors.push(req.params.id);
        await user.save();
        
        mentor.mentees.push(req.user.id);
        await mentor.save();
        
        res.json({
            success: true,
            message: 'Connected with mentor successfully'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/users/leaderboard
// @desc    Get user leaderboard
// @access  Private
router.get('/leaderboard', auth, async (req, res) => {
    try {
        // Get top users by engagement score
        const leaderboard = await User.find()
            .sort({ engagementScore: -1 })
            .limit(10)
            .select('firstName lastName profileImage userType engagementScore badges');
        
        res.json({
            success: true,
            leaderboard
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT api/users/password
// @desc    Update user password
// @access  Private
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Get user
        const user = await User.findById(req.user.id);
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Password updated successfully'
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
