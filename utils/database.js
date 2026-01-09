const mongoose = require('mongoose');
require('dotenv').config(); 
const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error; 
    }
};

module.exports = { connectDb };