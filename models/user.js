const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstName: {
        type: String, 
        required: true
    },
    lastName: {type: String },
    email: {
        type: String, 
        required: true,
        validate: {
            validator: (v) => {
                const {error} = JoiField.email.validate(v);
                if (error) throw new Error(error.details[0].message);
                return true;
            }
        }
    },
    password: {
        type: String, 
        required: true,
        validate: {
            validator: (v) => {
                const {error} = JoiField.password.validate(v);
                if (error) throw new Error.prototype(error.details[0].message);
                return true;
            }
        }
    },
    bio:{type: String},
    photoUrl: {
        type: String, 
        default: ""
    },

},{timestamps: true});

module.exports=mongoose.model('User', UserSchema);