// Search Routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Community = require('../models/Community');

// @route   GET api/search/users
// @desc    Search users by various criteria
// @access  Private
router.get('/users', auth, async (req, res) => {
    try {
        const { name, batch, branch, interest, userType, limit = 20, page = 1 } = req.query;
        
        // Build search criteria
        const searchQuery = {};
        
        if (userType) {
            searchQuery.userType = userType;
        }
        
        if (batch) {
            searchQuery.batch = batch;
        }
        
        if (branch) {
            searchQuery.branch = branch;
        }
        
        if (name) {
            const nameRegex = new RegExp(name, 'i');
            searchQuery.$or = [
                { firstName: nameRegex },
                { lastName: nameRegex }
            ];
        }
        
        if (interest) {
            searchQuery.interests = { $regex: interest, $options: 'i' };
        }
        
        // Execute search
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const users = await User.find(searchQuery)
            .select('firstName lastName profileImage batch branch userType interests skills bio')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ firstName: 1 });
        
        // Get total count for pagination
        const total = await User.countDocuments(searchQuery);
        
        res.json({
            success: true,
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/search/communities
// @desc    Search communities by various criteria
// @access  Private
router.get('/communities', auth, async (req, res) => {
    try {
        const { name, type, category, limit = 20, page = 1 } = req.query;
        
        // Build search criteria
        const searchQuery = {};
        
        if (type) {
            searchQuery.type = type;
        }
        
        if (category) {
            searchQuery.category = category;
        }
        
        if (name) {
            searchQuery.name = { $regex: name, $options: 'i' };
        }
        
        // Execute search
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const communities = await Community.find(searchQuery)
            .select('name description type category coverImage members')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ name: 1 })
            .populate({
                path: 'members',
                select: 'firstName lastName profileImage',
                options: { limit: 5 }
            });
        
        // Get total count for pagination
        const total = await Community.countDocuments(searchQuery);
        
        res.json({
            success: true,
            communities,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/search/batches
// @desc    Get all unique batch values
// @access  Private
router.get('/batches', auth, async (req, res) => {
    try {
        const batches = await User.distinct('batch');
        
        res.json({
            success: true,
            batches: batches.filter(batch => batch) // Filter out null/empty values
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/search/branches
// @desc    Get all unique branch values
// @access  Private
router.get('/branches', auth, async (req, res) => {
    try {
        const branches = await User.distinct('branch');
        
        res.json({
            success: true,
            branches: branches.filter(branch => branch) // Filter out null/empty values
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/search/interests
// @desc    Get all unique interest values
// @access  Private
router.get('/interests', auth, async (req, res) => {
    try {
        // This is more complex since interests is an array
        const users = await User.find({}, { interests: 1 });
        const interestSet = new Set();
        
        users.forEach(user => {
            if (user.interests && user.interests.length) {
                user.interests.forEach(interest => {
                    if (interest) interestSet.add(interest);
                });
            }
        });
        
        const interests = Array.from(interestSet).sort();
        
        res.json({
            success: true,
            interests
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
