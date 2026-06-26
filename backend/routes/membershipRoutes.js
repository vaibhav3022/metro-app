const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  createPlan,
  getActivePlans,
  createMembershipOrder,
  buyMembership,
  getMyMembership
} = require('../controllers/membershipController');

// Public/Open Routes
router.get('/plans', getActivePlans);

// Protected Routes (User/Member)
router.post('/create-razorpay-order', protect, createMembershipOrder);
router.post('/buy', protect, buyMembership);
router.get('/my', protect, getMyMembership);

// Admin Routes
router.post('/plans', protect, requireAdmin, createPlan);

module.exports = router;
