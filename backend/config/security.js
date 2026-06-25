const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const express = require('express');

/**
 * Apply all security middlewares
 */
function applySecurity(app) {
  // Secure HTTP headers
  app.use(helmet());

  // Block MongoDB injection ($ operators remove)
  app.use(mongoSanitize());

  // Block XSS attacks
  app.use(xss());

  // Block HTTP Parameter Pollution
  app.use(hpp());

  // Limit Request body size
  app.use(express.json({ limit: '10kb' }));
}

module.exports = { applySecurity };
