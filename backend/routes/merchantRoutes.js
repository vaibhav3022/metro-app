const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getTransactions,
  scanToken,
  getShop,
  updateShop,
  addProduct,
  editProduct,
  deleteProduct,
  addOffer,
  getNotifications,
  markNotificationRead,
  getStatus
} = require('../controllers/merchantController');
const { protect } = require('../middleware/authMiddleware');
const { requireMerchant } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/status', requireMerchant, getStatus); // Allowed even if pending

// Require Approved Merchant Status for below routes
router.use(requireMerchant); 

router.get('/dashboard', getDashboard);
router.get('/transactions', getTransactions);
router.post('/scan-token', scanToken);

router.get('/shop', getShop);
router.put('/shop', updateShop);
router.post('/shop/product', addProduct);
router.put('/shop/product/:id', editProduct);
router.delete('/shop/product/:id', deleteProduct);
router.post('/shop/offer', addOffer);

router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;
