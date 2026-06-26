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
  getStatus,
  registerMerchant
} = require('../controllers/merchantController');
const { protect } = require('../middleware/authMiddleware');
const { requireMerchant } = require('../middleware/roleMiddleware');
const upload = require('../utils/upload');

router.use(protect);

router.get('/status', getStatus); // Allowed for any logged in user who applied
router.post('/register', upload.fields([
  { name: 'aadhar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), registerMerchant);

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
