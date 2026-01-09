const mongoose = require('mongoose');
const { Schema } = mongoose;

const DeckSchema = new Schema ({
    title: {
        type: String,
        required: true
    },
    description: String,
    userId: {
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
    }
},{timestamps: true})

module.exports = mongoose.model('Deck', DeckSchema);