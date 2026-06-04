// Badge Model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BadgeSchema = new Schema({
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
    icon: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['engagement', 'achievement', 'milestone', 'special'],
        default: 'achievement'
    },
    level: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze'
    },
    points: {
        type: Number,
        default: 10
    },
    requirements: {
        type: String,
        required: true,
        trim: true
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Badge', BadgeSchema);
