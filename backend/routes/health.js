const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * GET /health
 * Load balancer / Docker healthcheck
 */
router.get('/', async (req, res) => {
  const checks = {
    db    : mongoose.connection.readyState === 1,  // 1 = connected
    uptime: process.uptime(),
    memory: process.memoryUsage().heapUsed,
  };

  const healthy = checks.db;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    ...checks,
  });
});

module.exports = router;
