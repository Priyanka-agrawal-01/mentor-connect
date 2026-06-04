// Badge Routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Badge = require('../models/Badge');
const { calculateEngagementScore } = require('../utils/ai-helpers');

// @route   GET api/badges
// @desc    Get all available badges
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const badges = await Badge.find().sort({ level: 1 });
        
        res.json({
            success: true,
            badges
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/badges/user
// @desc    Get all badges for current user
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('badges');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            badges: user.badges
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/badges/check
// @desc    Check and award badges for user
// @access  Private
router.post('/check', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('badges')
            .populate('goals')
            .populate('mentors')
            .populate('mentees');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get all available badges
        const allBadges = await Badge.find();
        
        // Get user's badges
        const userBadges = user.badges.map(badge => badge._id.toString());
        
        // Track newly awarded badges
        const newBadges = [];
        
        // Check for profile completion badge
        const profileCompleteBadge = allBadges.find(
            badge => badge.type === 'profile' && badge.criteria === 'complete'
        );
        
        if (profileCompleteBadge && 
            user.isProfileComplete && 
            !userBadges.includes(profileCompleteBadge._id.toString())) {
            user.badges.push(profileCompleteBadge._id);
            newBadges.push(profileCompleteBadge);
        }
        
        // Check for connection badges
        if (user.userType === 'student') {
            const connectionCounts = [1, 3, 5, 10];
            const mentorCount = user.mentors.length;
            
            connectionCounts.forEach(count => {
                if (mentorCount >= count) {
                    const connectionBadge = allBadges.find(
                        badge => badge.type === 'connection' && badge.criteria === `mentors-${count}`
                    );
                    
                    if (connectionBadge && !userBadges.includes(connectionBadge._id.toString())) {
                        user.badges.push(connectionBadge._id);
                        newBadges.push(connectionBadge);
                    }
                }
            });
        } else if (user.userType === 'mentor') {
            const menteeCount = user.mentees.length;
            const mentorCounts = [1, 5, 10, 25];
            
            mentorCounts.forEach(count => {
                if (menteeCount >= count) {
                    const menteeBadge = allBadges.find(
                        badge => badge.type === 'mentorship' && badge.criteria === `mentees-${count}`
                    );
                    
                    if (menteeBadge && !userBadges.includes(menteeBadge._id.toString())) {
                        user.badges.push(menteeBadge._id);
                        newBadges.push(menteeBadge);
                    }
                }
            });
        }
        
        // Check for goal completion badges
        if (user.goals.length > 0) {
            const completedGoals = user.goals.filter(goal => goal.status === 'completed');
            const goalCounts = [1, 3, 5, 10];
            
            goalCounts.forEach(count => {
                if (completedGoals.length >= count) {
                    const goalBadge = allBadges.find(
                        badge => badge.type === 'achievement' && badge.criteria === `goals-${count}`
                    );
                    
                    if (goalBadge && !userBadges.includes(goalBadge._id.toString())) {
                        user.badges.push(goalBadge._id);
                        newBadges.push(goalBadge);
                    }
                }
            });
        }
        
        // Update engagement score
        user.engagementScore = await calculateEngagementScore(user);
        
        // Check for engagement badges
        const engagementLevels = [25, 50, 75, 90];
        
        engagementLevels.forEach(level => {
            if (user.engagementScore >= level) {
                const engagementBadge = allBadges.find(
                    badge => badge.type === 'engagement' && badge.criteria === `score-${level}`
                );
                
                if (engagementBadge && !userBadges.includes(engagementBadge._id.toString())) {
                    user.badges.push(engagementBadge._id);
                    newBadges.push(engagementBadge);
                }
            }
        });
        
        // Save user with new badges
        await user.save();
        
        res.json({
            success: true,
            newBadges,
            allBadges: user.badges
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/badges/seed
// @desc    Seed default badges (admin only)
// @access  Private
router.post('/seed', auth, async (req, res) => {
    try {
        // In a real app, this would be admin-only
        // For prototype, any authenticated user can trigger this
        
        // Check if badges already exist
        const existingBadges = await Badge.countDocuments();
        
        if (existingBadges > 0) {
            return res.status(400).json({
                success: false,
                message: 'Badges already seeded'
            });
        }
        
        // Default badges
        const defaultBadges = [
            // Profile badges
            {
                name: 'Profile Star',
                description: 'Completed your profile information',
                type: 'profile',
                criteria: 'complete',
                icon: 'profile-star',
                level: 1
            },
            
            // Connection badges (for students)
            {
                name: 'First Connection',
                description: 'Connected with your first mentor',
                type: 'connection',
                criteria: 'mentors-1',
                icon: 'connection-1',
                level: 1
            },
            {
                name: 'Network Builder',
                description: 'Connected with 3 mentors',
                type: 'connection',
                criteria: 'mentors-3',
                icon: 'connection-3',
                level: 2
            },
            {
                name: 'Networking Pro',
                description: 'Connected with 5 mentors',
                type: 'connection',
                criteria: 'mentors-5',
                icon: 'connection-5',
                level: 3
            },
            {
                name: 'Connection Master',
                description: 'Connected with 10 mentors',
                type: 'connection',
                criteria: 'mentors-10',
                icon: 'connection-10',
                level: 4
            },
            
            // Mentorship badges (for mentors)
            {
                name: 'Mentor Initiate',
                description: 'Started mentoring your first student',
                type: 'mentorship',
                criteria: 'mentees-1',
                icon: 'mentor-1',
                level: 1
            },
            {
                name: 'Helping Hand',
                description: 'Mentoring 5 students',
                type: 'mentorship',
                criteria: 'mentees-5',
                icon: 'mentor-5',
                level: 2
            },
            {
                name: 'Guidance Guru',
                description: 'Mentoring 10 students',
                type: 'mentorship',
                criteria: 'mentees-10',
                icon: 'mentor-10',
                level: 3
            },
            {
                name: 'Mentor Legend',
                description: 'Mentoring 25 students',
                type: 'mentorship',
                criteria: 'mentees-25',
                icon: 'mentor-25',
                level: 4
            },
            
            // Achievement badges
            {
                name: 'Goal Getter',
                description: 'Completed your first goal',
                type: 'achievement',
                criteria: 'goals-1',
                icon: 'goal-1',
                level: 1
            },
            {
                name: 'Achiever',
                description: 'Completed 3 goals',
                type: 'achievement',
                criteria: 'goals-3',
                icon: 'goal-3',
                level: 2
            },
            {
                name: 'Overachiever',
                description: 'Completed 5 goals',
                type: 'achievement',
                criteria: 'goals-5',
                icon: 'goal-5',
                level: 3
            },
            {
                name: 'Master Achiever',
                description: 'Completed 10 goals',
                type: 'achievement',
                criteria: 'goals-10',
                icon: 'goal-10',
                level: 4
            },
            
            // Engagement badges
            {
                name: 'Active Participant',
                description: 'Reached 25% engagement score',
                type: 'engagement',
                criteria: 'score-25',
                icon: 'engagement-25',
                level: 1
            },
            {
                name: 'Engaged Member',
                description: 'Reached 50% engagement score',
                type: 'engagement',
                criteria: 'score-50',
                icon: 'engagement-50',
                level: 2
            },
            {
                name: 'Community Pillar',
                description: 'Reached 75% engagement score',
                type: 'engagement',
                criteria: 'score-75',
                icon: 'engagement-75',
                level: 3
            },
            {
                name: 'Community Champion',
                description: 'Reached 90% engagement score',
                type: 'engagement',
                criteria: 'score-90',
                icon: 'engagement-90',
                level: 4
            }
        ];
        
        // Insert badges
        await Badge.insertMany(defaultBadges);
        
        res.json({
            success: true,
            message: 'Default badges seeded successfully',
            count: defaultBadges.length
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
