const express = require('express');
const router = express.Router();
const { getSummary, getChart, getTokenAnalytics, getMerchantRankings } = require('../controllers/revenueController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.use(protect, requireAdmin);

router.get('/summary', getSummary);
router.get('/chart', getChart);
router.get('/token-analytics', getTokenAnalytics);
router.get('/merchant-rankings', getMerchantRankings);
router.get('/merchant-orders/:id', require('../controllers/revenueController').getMerchantOrders);

module.exports = router;
