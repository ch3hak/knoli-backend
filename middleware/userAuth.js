const jwt = require('jsonwebtoken');
const User = require('../models/user');

const userAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: 'No token provided. Unauthorized.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await User.findById(decoded._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user;
    next();
    } catch (err) {
        console.error('Auth Error:', err);
        return res.status(401).json({ message: 'Unauthorized. Invalid token.' });
    }
};

module.exports = userAuth;
