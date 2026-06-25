const express = require('express');
const {
  getWalletBalance,
  createRazorpayOrder,
  addMoney,
  getTransactionHistory,
  buyTokens
} = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');
const idempotency = require('../middleware/idempotency');
const validate = require('../middleware/validate');
const { walletTopupSchema } = require('../schemas/ticketSchema');

const router = express.Router();

router.get('/balance', protect, getWalletBalance);
router.post('/create-razorpay-order', protect, createRazorpayOrder);
// @route   POST /api/wallet/add-money
// @desc    Add money to wallet via Stripe
// @access  Private
router.post('/add-money', protect, validate(walletTopupSchema), idempotency, addMoney);
router.post('/buy-tokens', protect, buyTokens);
router.get('/transactions', protect, getTransactionHistory);

module.exports = router;
