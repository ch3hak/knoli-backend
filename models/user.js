const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstName: {
        type: String, 
        required: true
    },
    lastName: {type: String, default: ""},
    email: {
        type: String, 
        required: true,
        unique: true,
    },
    password: {
        type: String, 
        required: true,
    },
    bio:{type: String, default: ""},
    photoUrl: {
        type: String, 
        default: ""
    },

},{timestamps: true}
);

module.exports=mongoose.model('User', UserSchema);