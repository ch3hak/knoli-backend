const mongoose = require('mongoose');
const { Schema } = mongoose;

const FlashcardSchema = new Schema ({
    deck: {
        type: Schema.Types.ObjectId,
        ref: 'Deck',
        required: true
    },
    front: {
        type: String,
        required: true
    },
    back: {
        type: String,
        required: true
    },
    media: {
        imageUrl: String,
        audioUrl: String
    },
    tags: [String],
},{timestamps: true})

module.exports = mongoose.model('Flashcard', FlashcardSchema);