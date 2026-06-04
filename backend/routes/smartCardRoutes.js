const express = require('express');
const router = express.Router();
const { linkSmartCard, getSmartCards, rechargeSmartCard } = require('../controllers/smartCardController');
const { protect } = require('../middleware/authMiddleware');

router.post('/link', protect, linkSmartCard);
router.get('/', protect, getSmartCards);
router.post('/recharge', protect, rechargeSmartCard);

module.exports = router;
