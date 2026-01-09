const mongoose = require('mongoose');
const flashcard = require('./flashcard');
const { Schema } = mongoose;

const CardProgressSchema = new Schema ({
    user: {
        type: Schema.Types.ObjectId, 
        ref: 'User',      
        required: true
    },
    flashcard:{
        type: Schema.Types.ObjectId, 
        ref: 'Flashcard', 
        required: true
    },
    status: {
        type: String,
        enum: ['red', 'yellow', 'green'],
        default: 'red'
    },
    correctStreak: {
        type: Number,
        default: 0
    },
},{timestamps: true})

CardProgressSchema.index({user:1, flashcard:1}, {unique:true})

module.exports=mongoose.model('CardProgress', CardProgressSchema);