const express = require('express');
const router = express.Router();
const {
  createGiftCardOrder,
  createGiftCard,
  sendGiftCard,
  redeemGiftCard,
  getMyGiftCards,
  getReceivedGiftCards,
  getGiftCardByCode
} = require('../controllers/giftCardController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createGiftCardOrder);
router.post('/create', protect, createGiftCard);
router.post('/send', protect, sendGiftCard);
router.post('/redeem', protect, redeemGiftCard);
router.get('/sent', protect, getMyGiftCards);
router.get('/received', protect, getReceivedGiftCards);
router.get('/:code', protect, getGiftCardByCode);

module.exports = router;
