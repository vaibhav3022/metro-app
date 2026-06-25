const express = require('express');
const router = express.Router();
const {
  createGiftCard,
  redeemGiftCard,
  getMyGiftCards,
  getReceivedGiftCards,
  getGiftCardByCode
} = require('../controllers/giftCardController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createGiftCard);
router.post('/redeem', protect, redeemGiftCard);
router.get('/sent', protect, getMyGiftCards);
router.get('/received', protect, getReceivedGiftCards);
router.get('/:code', protect, getGiftCardByCode);

module.exports = router;
