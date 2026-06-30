const User = require('../models/User');
const Merchant = require('../models/Merchant');
const Shop = require('../models/Shop');
const Ticket = require('../models/Ticket');
const TokenTransaction = require('../models/TokenTransaction');
const Revenue = require('../models/Revenue');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const QRCode = require('qrcode');
const crypto = require('crypto');

const logAction = async (action, performedBy, targetId, targetModel, details) => {
  await AuditLog.create({ action, performedBy, targetId, targetModel, details });
};

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalMerchants = await Merchant.countDocuments();
    const approvedShops = await Merchant.countDocuments({ status: 'approved' });
    const pendingShops = await Merchant.countDocuments({ status: 'pending' });
    const suspendedShops = await Merchant.countDocuments({ status: 'suspended' });
    
    // Aggregations
    const tokenSalesAgg = await TokenTransaction.aggregate([{ $match: { type: 'purchase', status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    const tokenSales = tokenSalesAgg[0]?.total || 0;
    
    const ticketSalesAgg = await Ticket.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, total: { $sum: '$fare' } } }]);
    const ticketSales = ticketSalesAgg[0]?.total || 0;
    
    const totalRevenue = tokenSales + ticketSales;

    const recentBookings = await Ticket.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(10);
    
    const tokenTxs = await TokenTransaction.find().populate('userId', 'name').populate('merchantId', 'businessName').sort({ createdAt: -1 }).limit(10);
    const shopTxs = await require('../models/ShopTransaction').find().populate('userId', 'name').populate('shopId', 'shopName imageUrl').sort({ timestamp: -1 }).limit(10);

    const formattedTokenTxs = await Promise.all(tokenTxs.map(async (tx) => {
      let imageUrl = null;
      if (tx.merchantId) {
        const shop = await Shop.findOne({ merchantId: tx.merchantId._id });
        if (shop) imageUrl = shop.imageUrl;
      }
      return { ...tx.toObject(), shopImageUrl: imageUrl, paymentMethod: 'Token', createdAt: tx.createdAt };
    }));

    const formattedShopTxs = shopTxs.map(tx => ({
      ...tx.toObject(),
      merchantId: { businessName: tx.shopId?.shopName || 'Shop' },
      shopImageUrl: tx.shopId?.imageUrl,
      type: 'purchase',
      paymentMethod: 'Wallet/Razorpay',
      createdAt: tx.timestamp
    }));

    const recentTransactions = [...formattedTokenTxs, ...formattedShopTxs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue, totalUsers, activeUsers: totalUsers, totalMerchants, approvedShops, pendingMerchantRequests: pendingShops, suspendedShops, totalTransactions: await TokenTransaction.countDocuments()
      },
      recentBookings, recentTransactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMerchants = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.businessName = { $regex: search, $options: 'i' };

    const merchants = await Merchant.find(query)
      .populate('userId', 'name email phone')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Merchant.countDocuments(query);
    
    res.status(200).json({ success: true, data: merchants, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) { res.status(500).json({ success: false, message: 'Error fetching merchants' }); }
};

const changeMerchantStatus = async (req, res, status, actionName) => {
  try {
    const merchant = await Merchant.findById(req.params.id).populate('userId');
    if (!merchant) return res.status(404).json({ success: false, message: 'Merchant not found' });
    
    merchant.status = status;
    if (status === 'approved') {
      merchant.approvedAt = new Date();
      if (!merchant.qrCodeToken) {
        merchant.qrCodeToken = crypto.randomBytes(16).toString('hex');
        const qrData = JSON.stringify({
          type: 'merchant_payment',
          mId: merchant._id.toString(),
          token: merchant.qrCodeToken,
          businessName: merchant.businessName,
          merchantName: merchant.businessName,
          shopName: merchant.businessName
        });
        merchant.qrCodeImageUrl = await QRCode.toDataURL(qrData);
      }
    }
    if (status === 'suspended') merchant.suspendedAt = new Date();
    if (req.body.reason) merchant.rejectionReason = req.body.reason;
    await merchant.save();
    
    const user = await User.findById(merchant.userId._id);
    if (user) {
      user.merchantStatus = status;
      await user.save();
      await Notification.create({
        recipientId: user._id, recipientRole: 'merchant',
        title: `Merchant Account ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your merchant account status has been changed to ${status}. ${req.body.reason || ''}`,
        type: status === 'approved' ? 'success' : (status === 'rejected' || status === 'suspended' ? 'alert' : 'info')
      });
    }

    await logAction(actionName, req.user._id, merchant._id, 'Merchant', { status, reason: req.body.reason });
    res.status(200).json({ success: true, message: `Merchant ${status}` });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to change status' }); }
};

const approveMerchant = (req, res) => changeMerchantStatus(req, res, 'approved', 'APPROVE_MERCHANT');
const rejectMerchant = (req, res) => changeMerchantStatus(req, res, 'rejected', 'REJECT_MERCHANT');
const suspendMerchant = (req, res) => changeMerchantStatus(req, res, 'suspended', 'SUSPEND_MERCHANT');
const reactivateMerchant = (req, res) => changeMerchantStatus(req, res, 'approved', 'REACTIVATE_MERCHANT');

const deleteMerchant = async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.params.id);
    if (!merchant) return res.status(404).json({ success: false, message: 'Not found' });
    await Shop.deleteMany({ merchantId: merchant._id });
    await User.findByIdAndUpdate(merchant.userId, { merchantStatus: 'none', role: 'user' });
    await Merchant.findByIdAndDelete(merchant._id);
    await logAction('DELETE_MERCHANT', req.user._id, merchant._id, 'Merchant', {});
    res.status(200).json({ success: true, message: 'Merchant deleted' });
  } catch (err) { res.status(500).json({ success: false }); }
};

const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = { role: 'user' };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(query).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await User.countDocuments(query);
    res.status(200).json({ success: true, data: users, total, page: parseInt(page), pages: Math.ceil(total/limit) });
  } catch (err) { res.status(500).json({ success: false }); }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await logAction('DELETE_USER', req.user._id, req.params.id, 'User', {});
    res.status(200).json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
};

const getRevenueSummary = async (req, res) => { 
  res.status(200).json({ 
    success: true, 
    data: { totalRevenue: 124500, ticketRevenue: 85000, walletRecharges: 39500 } 
  }); 
};

const getRevenueChart = async (req, res) => { 
  const mockChartData = [
    { date: 'Mon', tickets: 12000, wallet: 5000 },
    { date: 'Tue', tickets: 15000, wallet: 7000 },
    { date: 'Wed', tickets: 11000, wallet: 4000 },
    { date: 'Thu', tickets: 18000, wallet: 8000 },
    { date: 'Fri', tickets: 22000, wallet: 10000 },
    { date: 'Sat', tickets: 25000, wallet: 12000 },
    { date: 'Sun', tickets: 20000, wallet: 9000 },
  ];
  res.status(200).json({ success: true, data: mockChartData }); 
};
const getAnalytics = async (req, res) => { res.status(200).json({ success: true }); };

const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const logs = await AuditLog.find().populate('performedBy', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await AuditLog.countDocuments();
    res.status(200).json({ success: true, data: logs, total, page: parseInt(page), pages: Math.ceil(total/limit) });
  } catch (err) { res.status(500).json({ success: false }); }
};

module.exports = {
  getDashboardStats, getMerchants, approveMerchant, rejectMerchant, suspendMerchant,
  reactivateMerchant, deleteMerchant, getUsers, deleteUser,
  getRevenueSummary, getRevenueChart, getAnalytics, getAuditLogs
};
