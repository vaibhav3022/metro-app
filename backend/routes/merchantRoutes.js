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
  deleteOffer,
  getNotifications,
  markNotificationRead,
  getStatus,
  registerMerchant,
  createWithdrawalRequest,
  getWithdrawals,
  submitSupportTicket,
  getSupportTickets,
  uploadKyc,
  uploadShopImage
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
router.post('/upload-kyc', upload.fields([
  { name: 'aadhar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), uploadKyc);

// Require Approved Merchant Status for below routes
router.use(requireMerchant); 

router.get('/dashboard', getDashboard);
router.get('/transactions', getTransactions);
router.post('/scan-token', scanToken);

router.get('/shop', getShop);
router.put('/shop', updateShop);
router.post('/shop/image', upload.single('shopImage'), uploadShopImage);
router.post('/shop/product', upload.single('productImage'), addProduct);
router.put('/shop/product/:id', upload.single('productImage'), editProduct);
router.delete('/shop/product/:id', deleteProduct);
router.post('/shop/offer', addOffer);
router.delete('/shop/offer/:id', deleteOffer);

router.post('/withdrawals', createWithdrawalRequest);
router.get('/withdrawals', getWithdrawals);
router.post('/support', submitSupportTicket);
router.get('/support', getSupportTickets);

router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;
