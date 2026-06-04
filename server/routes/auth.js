// Authentication Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, userType, batch, branch } = req.body;
        
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists'
            });
        }
        
        // Validate required fields
        if (!batch || !branch) {
            return res.status(400).json({
                success: false,
                message: 'Batch and branch are required fields'
            });
        }
        
        // Create new user
        user = new User({
            firstName,
            lastName,
            email,
            password,
            userType: userType || 'student',
            batch,
            branch,
            accountStatus: 'pending',
            verificationProgress: 0
        });
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        // Save user
        await user.save();
        
        // Generate JWT token
        const payload = {
            user: {
                id: user.id
            }
        };
        
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'mentorconnect_secret',
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token,
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        userType: user.userType,
                        batch: user.batch,
                        branch: user.branch,
                        accountStatus: user.accountStatus,
                        verificationProgress: user.verificationProgress
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/auth/login
// @desc    Login user and get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Update online status
        user.isOnline = true;
        user.lastSeen = Date.now();
        await user.save();
        
        // Generate JWT token
        const payload = {
            user: {
                id: user.id
            }
        };
        
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'mentorconnect_secret',
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token,
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        userType: user.userType,
                        profileImage: user.profileImage,
                        batch: user.batch,
                        branch: user.branch,
                        accountStatus: user.accountStatus,
                        verificationProgress: user.verificationProgress,
                        documentsVerified: {
                            idCard: user.documents?.idCard?.verified || false,
                            marksheet: user.documents?.marksheet?.verified || false
                        }
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/auth/google
// @desc    Login/Register with Google
// @access  Public
router.post('/google', async (req, res) => {
    try {
        const { token, userType } = req.body;
        
        // In a real app, verify Google token and get user info
        // For now, simulate this process with mock data
        const googleUser = {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            profileImage: req.body.profileImage
        };
        
        // Check if user exists
        let user = await User.findOne({ email: googleUser.email });
        
        if (!user) {
            // Create new user
            user = new User({
                firstName: googleUser.firstName,
                lastName: googleUser.lastName,
                email: googleUser.email,
                password: 'google-oauth',  // This would be a random secure string in a real app
                userType: userType || 'student',
                profileImage: googleUser.profileImage
            });
            
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
            
            await user.save();
        }
        
        // Update last active timestamp
        user.lastActive = Date.now();
        await user.save();
        
        // Generate JWT token
        const payload = {
            user: {
                id: user.id
            }
        };
        
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'mentorconnect_secret',
            { expiresIn: '7d' },
            (err, jwtToken) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token: jwtToken,
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        userType: user.userType,
                        profileImage: user.profileImage,
                        isProfileComplete: user.isProfileComplete
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/auth/linkedin
// @desc    Login/Register with LinkedIn
// @access  Public
router.post('/linkedin', async (req, res) => {
    // Similar implementation to Google auth
    // Omitted for brevity
    res.json({
        success: true,
        message: 'LinkedIn authentication would be implemented here'
    });
});

module.exports = router;
