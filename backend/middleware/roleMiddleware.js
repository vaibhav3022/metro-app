const Merchant = require('../models/Merchant');

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
  }
};

const requireUser = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden: User access required' });
  }
};

const requireMerchant = async (req, res, next) => {
  if (req.user && req.user.role === 'merchant') {
    // Also attach merchant object
    try {
      const merchant = await Merchant.findOne({ userId: req.user._id });
      if (!merchant) {
        return res.status(404).json({ success: false, message: 'Merchant profile not found' });
      }
      // If path is not /status, check if approved
      if (req.path !== '/status' && merchant.status !== 'approved') {
        return res.status(403).json({ success: false, message: 'Forbidden: Merchant account is not approved' });
      }
      req.merchant = merchant;
      next();
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server Error verifying merchant status' });
    }
  } else {
    res.status(403).json({ success: false, message: 'Forbidden: Merchant access required' });
  }
};

module.exports = { requireAdmin, requireUser, requireMerchant };
