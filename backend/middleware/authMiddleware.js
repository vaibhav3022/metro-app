const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Decode/Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'puneMetroSecretKey2024');

      // Add user to request object
      req.user = await User.findById(decoded.id).select('-otp');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found in system, unauthorized access.' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'TokenExpired', expiredAt: error.expiredAt });
      }
      
      return res.status(401).json({ message: 'Not authorized, token validation failed.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, access token missing.' });
  }
};

module.exports = { protect };
