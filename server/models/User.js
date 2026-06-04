// User Model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: ''
    },
    batch: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: ''
    },
    skills: [{
        type: String,
        trim: true
    }],
    interests: [{
        type: String,
        trim: true
    }],
    careerGoals: [{
        type: String,
        trim: true
    }],
    linkedin: {
        type: String,
        default: ''
    },
    github: {
        type: String,
        default: ''
    },
    availableForMentorship: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    communities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    }],
    badges: [{
        name: String,
        icon: String,
        color: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    documents: {
        idCard: {
            url: String,
            verified: {
                type: Boolean,
                default: false
            },
            verificationDate: Date,
            rejectionReason: String
        },
        marksheet: {
            url: String,
            verified: {
                type: Boolean,
                default: false
            },
            verificationDate: Date,
            rejectionReason: String
        }
    },
    accountStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    verificationProgress: {
        type: Number,
        default: 0
    },
    userType: {
        type: String,
        enum: ['student', 'mentor', 'admin'],
        default: 'student'
    },
    education: [{
        institution: String,
        degree: String,
        field: String,
        startYear: Number,
        endYear: Number,
        current: Boolean
    }],
    experience: [{
        company: String,
        position: String,
        description: String,
        startDate: Date,
        endDate: Date,
        current: Boolean
    }],
    mentors: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    mentees: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    conversations: [{
        type: Schema.Types.ObjectId,
        ref: 'Conversation'
    }],
    goals: [{
        type: Schema.Types.ObjectId,
        ref: 'Goal'
    }],
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    engagementScore: {
        type: Number,
        default: 0
    },
    isProfileComplete: {
        type: Boolean,
        default: false
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Virtual for user's full name
UserSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for user's display name
UserSchema.virtual('displayName').get(function() {
    return this.firstName;
});

// Method to get user's matching score with another user
UserSchema.methods.getMatchingScore = function(otherUser) {
    // Calculate match based on skills, interests, and career goals
    const skillsMatch = this.getArrayMatchScore(this.skills, otherUser.skills);
    const interestsMatch = this.getArrayMatchScore(this.interests, otherUser.interests);
    const goalsMatch = this.getArrayMatchScore(this.careerGoals, otherUser.careerGoals);
    
    // Weighted score (skills are more important)
    return (skillsMatch * 0.5) + (interestsMatch * 0.3) + (goalsMatch * 0.2);
};

// Helper method to compare arrays
UserSchema.methods.getArrayMatchScore = function(arr1, arr2) {
    if (!arr1.length || !arr2.length) return 0;
    
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    
    let matchCount = 0;
    set1.forEach(item => {
        if (set2.has(item)) matchCount++;
    });
    
    return matchCount / Math.max(set1.size, set2.size);
};

module.exports = mongoose.model('User', UserSchema);
