const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  registerShop,
  getAllShops,
  payShop,
  getMerchantTransactions,
  acceptTokens
} = require('../controllers/shopController');



// All shop routes require authentication
router.use(protect);

router.post('/register', registerShop);
router.get('/', getAllShops);
router.post('/pay', payShop);
router.get('/merchant-transactions', protect, getMerchantTransactions);
router.post('/accept-tokens', protect, acceptTokens);

module.exports = router;
