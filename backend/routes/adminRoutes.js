const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getMerchants,
  approveMerchant,
  rejectMerchant,
  suspendMerchant,
  reactivateMerchant,
  deleteMerchant,
  getUsers,
  deleteUser,
  getRevenueSummary,
  getRevenueChart,
  getAnalytics,
  getAuditLogs,
  getWithdrawals,
  updateWithdrawalStatus,
  getComplaints,
  updateComplaintStatus,
  getSystemSettings,
  updateSystemSettings,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getDatabaseStats
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.use(protect, requireAdmin);

router.get('/dashboard', getDashboardStats);

router.get('/merchants', getMerchants);
router.put('/merchants/:id/approve', approveMerchant);
router.put('/merchants/:id/reject', rejectMerchant);
router.put('/merchants/:id/suspend', suspendMerchant);
router.put('/merchants/:id/reactivate', reactivateMerchant);
router.delete('/merchants/:id', deleteMerchant);

router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

router.get('/revenue', getRevenueSummary);
router.get('/revenue/chart', getRevenueChart);
router.get('/analytics', getAnalytics);

router.get('/audit-logs', getAuditLogs);

router.get('/withdrawals', getWithdrawals);
router.put('/withdrawals/:id', updateWithdrawalStatus);

router.get('/complaints', getComplaints);
router.put('/complaints/:id', updateComplaintStatus);

router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

router.get('/db-stats', getDatabaseStats);

module.exports = router;
