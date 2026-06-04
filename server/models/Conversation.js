// Conversation Model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    isGroupChat: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        trim: true
    },
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: 'Message'
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    },
    isAIAssistant: {
        type: Boolean,
        default: false
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

// Update the lastUpdated timestamp before save
ConversationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Conversation', ConversationSchema);
