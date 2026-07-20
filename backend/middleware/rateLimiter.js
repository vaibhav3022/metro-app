const rateLimit = require('express-rate-limit');

// General API limiter
const apiLimiter = rateLimit({
  windowMs : 60_000,   // 1 minute
  max      : 100,
  handler  : (req, res) => res.status(429).json({
    error: 'Too many requests. Please try after a minute.',
  }),
});

// OTP / Auth — stricter
const authLimiter = rateLimit({
  windowMs : 15 * 60_000,  // 15 minutes
  max      : 5,
  handler  : (req, res) => res.status(429).json({
    error: 'Too many OTP attempts. Try after 15 minutes.',
  }),
});

// Payment — strict
const paymentLimiter = rateLimit({
  windowMs : 60_000,
  max      : 10,
  handler  : (req, res) => res.status(429).json({
    error: 'Payment rate limit exceeded.',
  }),
});

module.exports = { apiLimiter, authLimiter, paymentLimiter };
