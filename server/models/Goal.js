// Goal Model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MilestoneSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    dueDate: {
        type: Date
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedDate: {
        type: Date
    },
    feedback: {
        type: String,
        trim: true
    }
});

const GoalSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mentor: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    category: {
        type: String,
        enum: ['career', 'education', 'skill', 'personal', 'other'],
        default: 'career'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    targetDate: {
        type: Date,
        required: true
    },
    milestones: [MilestoneSchema],
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed', 'on-hold'],
        default: 'not-started'
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedDate: {
        type: Date
    },
    mentorReviews: [{
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    relatedResources: [{
        title: String,
        url: String,
        type: {
            type: String,
            enum: ['article', 'video', 'book', 'course', 'other'],
            default: 'article'
        }
    }],
    aiRecommendations: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before save
GoalSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Calculate progress based on completed milestones
    if (this.milestones && this.milestones.length > 0) {
        const totalMilestones = this.milestones.length;
        const completedMilestones = this.milestones.filter(m => m.isCompleted).length;
        this.progress = Math.round((completedMilestones / totalMilestones) * 100);
        
        // Update status based on progress
        if (this.progress === 0) {
            this.status = 'not-started';
        } else if (this.progress === 100) {
            this.status = 'completed';
            this.isCompleted = true;
            if (!this.completedDate) {
                this.completedDate = new Date();
            }
        } else {
            this.status = 'in-progress';
        }
    }
    
    next();
});

module.exports = mongoose.model('Goal', GoalSchema);
