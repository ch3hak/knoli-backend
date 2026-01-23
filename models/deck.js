const mongoose = require('mongoose');
const { Schema } = mongoose;

const DeckSchema = new Schema ({
    title: {
        type: String,
        required: true
    },
    description: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    tags: [String],
    sourceMaterial: {
        filename: String,
        originalContent: String, 
        uploadedAt: Date,
    },
    level: {
        type: Number,
        default: 1
    },
    xp: {
        type: Number,
        default: 0
    },
    xpToNextLevel: {
        type: Number,
        default: 100
    }
},{timestamps: true})

module.exports = mongoose.model('Deck', DeckSchema);