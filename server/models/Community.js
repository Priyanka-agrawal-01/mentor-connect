// Community Model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommunitySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['branch', 'batch', 'interest', 'general'],
        required: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    coverImage: {
        type: String,
        default: 'default-community.jpg'
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    moderators: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    messages: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        attachments: [{
            type: String
        }],
        reactions: [{
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            type: {
                type: String,
                enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry']
            }
        }]
    }],
    events: [{
        title: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date
        },
        location: {
            type: String
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    isPublic: {
        type: Boolean,
        default: true
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

// Update timestamp on save
CommunitySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Community', CommunitySchema);
