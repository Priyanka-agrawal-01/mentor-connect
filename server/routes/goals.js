// Goals Routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');
const User = require('../models/User');

// @route   GET api/goals
// @desc    Get all goals for a user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user.id })
            .populate({
                path: 'mentor',
                select: 'firstName lastName profileImage'
            })
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            goals
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/goals
// @desc    Create a new goal
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            priority,
            targetDate,
            mentorId,
            milestones
        } = req.body;
        
        // Check if mentor exists if provided
        if (mentorId) {
            const mentor = await User.findById(mentorId);
            if (!mentor || mentor.userType !== 'mentor') {
                return res.status(404).json({
                    success: false,
                    message: 'Mentor not found'
                });
            }
        }
        
        // Create new goal
        const newGoal = new Goal({
            title,
            description,
            user: req.user.id,
            mentor: mentorId,
            category: category || 'career',
            priority: priority || 'medium',
            targetDate,
            milestones: milestones || []
        });
        
        await newGoal.save();
        
        // Add goal to user's goals
        await User.findByIdAndUpdate(
            req.user.id,
            { $push: { goals: newGoal._id } }
        );
        
        // If mentor provided, populate mentor info
        if (mentorId) {
            await newGoal.populate({
                path: 'mentor',
                select: 'firstName lastName profileImage'
            });
        }
        
        res.json({
            success: true,
            goal: newGoal
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/goals/:id
// @desc    Get a specific goal
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id)
            .populate({
                path: 'mentor',
                select: 'firstName lastName profileImage email'
            })
            .populate({
                path: 'user',
                select: 'firstName lastName profileImage'
            });
        
        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }
        
        // Check if user owns the goal or is the mentor
        if (goal.user._id.toString() !== req.user.id && 
            (!goal.mentor || goal.mentor._id.toString() !== req.user.id)) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to view this goal'
            });
        }
        
        res.json({
            success: true,
            goal
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT api/goals/:id
// @desc    Update a goal
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            priority,
            targetDate,
            milestones,
            status
        } = req.body;
        
        // Find goal
        let goal = await Goal.findById(req.params.id);
        
        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }
        
        // Check ownership
        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this goal'
            });
        }
        
        // Update fields
        if (title) goal.title = title;
        if (description) goal.description = description;
        if (category) goal.category = category;
        if (priority) goal.priority = priority;
        if (targetDate) goal.targetDate = targetDate;
        if (milestones) goal.milestones = milestones;
        if (status) goal.status = status;
        
        // Save updated goal
        await goal.save();
        
        res.json({
            success: true,
            goal
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT api/goals/:id/milestone/:milestoneId
// @desc    Update a milestone status
// @access  Private
router.put('/:id/milestone/:milestoneId', auth, async (req, res) => {
    try {
        const { isCompleted, feedback } = req.body;
        
        // Find goal
        const goal = await Goal.findById(req.params.id);
        
        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }
        
        // Check ownership or mentorship
        const isMentor = goal.mentor && goal.mentor.toString() === req.user.id;
        if (goal.user.toString() !== req.user.id && !isMentor) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this milestone'
            });
        }
        
        // Find milestone
        const milestone = goal.milestones.id(req.params.milestoneId);
        
        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found'
            });
        }
        
        // Update milestone
        if (typeof isCompleted !== 'undefined') milestone.isCompleted = isCompleted;
        if (isCompleted && !milestone.completedDate) milestone.completedDate = new Date();
        if (feedback && isMentor) milestone.feedback = feedback;
        
        // Save goal
        await goal.save();
        
        res.json({
            success: true,
            goal
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/goals/:id/review
// @desc    Add mentor review to a goal
// @access  Private
router.post('/:id/review', auth, async (req, res) => {
    try {
        const { content } = req.body;
        
        // Find goal
        const goal = await Goal.findById(req.params.id);
        
        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }
        
        // Check if user is the mentor for this goal
        if (!goal.mentor || goal.mentor.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Only the assigned mentor can add reviews'
            });
        }
        
        // Add review
        goal.mentorReviews.push({
            content,
            timestamp: new Date()
        });
        
        await goal.save();
        
        res.json({
            success: true,
            goal
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        // Find goal
        const goal = await Goal.findById(req.params.id);
        
        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }
        
        // Check ownership
        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this goal'
            });
        }
        
        // Remove goal from user's goals array
        await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { goals: req.params.id } }
        );
        
        // Delete goal
        await Goal.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Goal deleted successfully'
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
