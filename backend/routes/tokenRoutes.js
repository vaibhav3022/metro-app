const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getBalance, getHistory, redeem } = require('../controllers/tokenController');
const { protect } = require('../middleware/authMiddleware');
const { requireUser } = require('../middleware/roleMiddleware');

router.use(protect, requireUser);

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);
router.get('/balance', getBalance);
router.get('/history', getHistory);
router.post('/redeem', redeem);

module.exports = router;
