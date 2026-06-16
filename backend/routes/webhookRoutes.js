const express = require('express');
const router = express.Router();
const { razorpayWebhook } = require('../controllers/webhookController');

// Note: Webhooks DO NOT use auth middleware because they are hit by Razorpay's external servers.
// Security is handled by verifying the HMAC signature inside the controller.
router.post('/razorpay', express.json(), razorpayWebhook);

module.exports = router;
