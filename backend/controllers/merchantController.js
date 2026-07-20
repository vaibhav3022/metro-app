const Merchant = require('../models/Merchant');
const Shop = require('../models/Shop');
const TokenTransaction = require('../models/TokenTransaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const MerchantTransaction = require('../models/MerchantTransaction');
const Complaint = require('../models/Complaint');
const path = require('path');
const fs = require('fs');

const getStatus = async (req, res) => {
  try {
    const merchant = await Merchant.findOne({ userId: req.user._id });
    if (!merchant) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({
      success: true,
      status: merchant.status,
      rejectionReason: merchant.rejectionReason,
      hasDocuments: !!(merchant.aadharUrl && merchant.panUrl && merchant.photoUrl),
      merchant
    });
  } catch (err) { res.status(500).json({ success: false }); }
};

const getDashboard = async (req, res) => {
  try {
    const merchant = req.merchant;
    const shop = await Shop.findOne({ merchantId: merchant._id });
    
    // 1. Calculate Token Transactions (Redemptions)
    const tokenAgg = await TokenTransaction.aggregate([
      { $match: { merchantId: merchant._id, type: 'redemption', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const tokensAccepted = tokenAgg[0]?.total || 0;
    const tokenOrders = tokenAgg[0]?.count || 0;
    const tokenUsers = await TokenTransaction.distinct('userId', { merchantId: merchant._id, type: 'redemption', status: 'success' });

    // 2. Calculate QR Scan Transactions
    const qrAgg = await MerchantTransaction.aggregate([
      { $match: { merchantId: merchant._id, type: 'qr_payment', status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$grossAmount' }, count: { $sum: 1 } } }
    ]);
    const qrSales = qrAgg[0]?.total || 0;
    const qrOrders = qrAgg[0]?.count || 0;
    const qrUsers = await MerchantTransaction.distinct('userId', { merchantId: merchant._id, type: 'qr_payment', status: 'SUCCESS' });

    // 3. Calculate Shop Transactions (Wallet/Razorpay)
    let shopSales = 0;
    let shopOrders = 0;
    let shopUsers = [];
    
    // In Shop model, merchantId refers to Merchant._id
    const merchantShop = await require('../models/Shop').findOne({ merchantId: merchant._id });
    if (merchantShop) {
      const shopAgg = await require('../models/ShopTransaction').aggregate([
        { $match: { shopId: merchantShop._id, status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);
      shopSales = shopAgg[0]?.total || 0;
      shopOrders = shopAgg[0]?.count || 0;
      shopUsers = await require('../models/ShopTransaction').distinct('userId', { shopId: merchantShop._id, status: 'SUCCESS' });
    }

    // Combine stats
    const totalSales = qrSales + shopSales + tokensAccepted;
    const totalOrders = qrOrders + shopOrders + tokenOrders;
    
    // Merge distinct users
    const uniqueUserIds = new Set([
      ...tokenUsers.map(id => id.toString()), 
      ...shopUsers.map(id => id.toString()),
      ...qrUsers.map(id => id.toString())
    ]);
    const totalCustomers = uniqueUserIds.size;

    merchant.totalTokensAccepted = tokensAccepted;
    merchant.totalOrders = totalOrders;
    merchant.totalEarnings = totalSales; 
    await merchant.save();

    res.status(200).json({
      success: true,
      merchantId: merchant._id,
      shopId: merchantShop ? merchantShop._id : null,
      businessName: merchant.businessName,
      stats: {
        totalSales,
        totalOrders,
        totalCustomers,
        qrSales
      },
      chartData: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], data: [0, 0, 0, qrSales || totalSales, 0, 0, 0] }
    });
  } catch (err) { 
    console.error('getDashboard Error:', err);
    res.status(500).json({ success: false }); 
  }
};

const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const tokenTxsRaw = await TokenTransaction.find({ merchantId: req.merchant._id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const qrTxsRaw = await MerchantTransaction.find({ merchantId: req.merchant._id, type: 'qr_payment' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
      
    let shopTxsRaw = [];
    const shops = await require('../models/Shop').find({ merchantId: req.merchant._id });
    if (shops.length > 0) {
      const shopIds = shops.map(s => s._id);
      shopTxsRaw = await require('../models/ShopTransaction').find({ shopId: { $in: shopIds } })
        .populate('userId', 'name')
        .sort({ timestamp: -1 })
        .limit(parseInt(limit));
    }

    const formattedTokenTxs = tokenTxsRaw.map(tx => ({
      ...tx.toObject(),
      paymentMethod: 'Token',
      createdAt: tx.createdAt
    }));

    const formattedQrTxs = qrTxsRaw.map(tx => ({
      ...tx.toObject(),
      paymentMethod: 'QR Scan',
      createdAt: tx.createdAt
    }));

    const formattedShopTxs = shopTxsRaw.map(tx => ({
      ...tx.toObject(),
      type: 'purchase',
      paymentMethod: 'Wallet/Razorpay',
      createdAt: tx.timestamp
    }));

    const allTxs = [...formattedTokenTxs, ...formattedShopTxs, ...formattedQrTxs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice((page - 1) * parseInt(limit), page * parseInt(limit));
      
    res.status(200).json({ success: true, data: allTxs });
  } catch (err) { 
    console.log(err);
    res.status(500).json({ success: false }); 
  }
};

const scanToken = async (req, res) => {
  try {
    const { customerId, amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const user = await User.findById(customerId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.tokenBalance < amount) return res.status(400).json({ success: false, message: 'Insufficient token balance' });

    user.tokenBalance -= amount;
    await user.save();

    const merchant = req.merchant;
    merchant.totalEarnings += amount;
    merchant.totalTokensAccepted += amount;
    merchant.totalOrders += 1;
    await merchant.save();

    const tx = await TokenTransaction.create({
      userId: user._id,
      merchantId: merchant._id,
      type: 'redemption',
      amount,
      status: 'success'
    });

    await Notification.create({
      recipientId: user._id, recipientRole: 'user',
      title: 'Tokens Spent', message: `You spent ${amount} tokens at ${merchant.businessName}.`, type: 'info'
    });

    res.status(200).json({ success: true, message: 'Tokens accepted', transaction: tx });
  } catch (err) { res.status(500).json({ success: false }); }
};

const getShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ merchantId: req.merchant._id });
    res.status(200).json({ success: true, shop });
  } catch (err) { res.status(500).json({ success: false }); }
};

const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findOneAndUpdate({ merchantId: req.merchant._id }, req.body, { new: true });
    if (shop && req.body.shopName) {
      await Merchant.findByIdAndUpdate(req.merchant._id, { businessName: req.body.shopName });
    }
    res.status(200).json({ success: true, shop });
  } catch (err) { res.status(500).json({ success: false }); }
};

const addProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ merchantId: req.merchant._id });
    
    const productData = { ...req.body };
    if (productData.isAvailable === 'true') productData.isAvailable = true;
    if (productData.isAvailable === 'false') productData.isAvailable = false;
    
    if (req.file) {
      productData.imageUrl = `/uploads/shop/${req.file.filename}`;
    }

    shop.products.push(productData);
    await shop.save();
    res.status(200).json({ success: true, shop });
  } catch (err) { res.status(500).json({ success: false }); }
};

const editProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ merchantId: req.merchant._id });
    const pIndex = shop.products.findIndex(p => p._id.toString() === req.params.id);
    
    if (pIndex > -1) {
      const productData = { ...req.body };
      if (productData.isAvailable === 'true') productData.isAvailable = true;
      if (productData.isAvailable === 'false') productData.isAvailable = false;
      
      if (req.file) {
        productData.imageUrl = `/uploads/shop/${req.file.filename}`;
      }
      
      shop.products[pIndex] = { ...shop.products[pIndex].toObject(), ...productData };
      await shop.save();
    }
    res.status(200).json({ success: true, shop });
  } catch (err) { res.status(500).json({ success: false }); }
};

const deleteProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ merchantId: req.merchant._id });
    shop.products = shop.products.filter(p => p._id.toString() !== req.params.id);
    await shop.save();
    res.status(200).json({ success: true, shop });
  } catch (err) { res.status(500).json({ success: false }); }
};

const addOffer = async (req, res) => {
  try {
    const shop = await Shop.findOne({ merchantId: req.merchant._id });
    const offerData = { ...req.body };
    
    // Parse applicableProducts if it's sent as stringified JSON array
    if (typeof offerData.applicableProducts === 'string') {
      try {
        offerData.applicableProducts = JSON.parse(offerData.applicableProducts);
      } catch (e) {
        offerData.applicableProducts = [];
      }
    }

    // Safely parse validUntil - support DD/MM/YYYY, YYYY-MM-DD, or any parseable format
    if (offerData.validUntil) {
      let parsedDate = null;
      const raw = offerData.validUntil.trim();
      
      // Try DD/MM/YYYY format
      const ddmmyyyy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddmmyyyy) {
        parsedDate = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2,'0')}-${ddmmyyyy[1].padStart(2,'0')}`);
      } else {
        // Try standard formats (YYYY-MM-DD etc)
        parsedDate = new Date(raw);
      }
      
      // Only set if valid date
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        offerData.validUntil = parsedDate;
      } else {
        delete offerData.validUntil; // skip invalid date
      }
    }
    
    shop.offers.push(offerData);
    await shop.save();
    res.status(200).json({ success: true, shop });
  } catch (err) {
    console.error('addOffer Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ recipientRole: 'merchant', recipientId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notifs });
  } catch (err) { res.status(500).json({ success: false }); }
};

const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
};

const registerMerchant = async (req, res) => {
  try {
    const { businessName, ownerName, shopAddress } = req.body;

    // Check if files exist
    if (!req.files || !req.files.aadhar || !req.files.pan || !req.files.photo) {
      return res.status(400).json({ success: false, message: 'All KYC documents are required (aadhar, pan, photo)' });
    }

    // Check if user already applied
    let merchant = await Merchant.findOne({ userId: req.user._id });
    if (merchant) {
      return res.status(400).json({ success: false, message: 'You have already applied for a merchant account.' });
    }

    merchant = await Merchant.create({
      userId: req.user._id,
      businessName,
      ownerName,
      shopAddress,
      aadharUrl: req.files.aadhar[0].filename,
      panUrl: req.files.pan[0].filename,
      photoUrl: req.files.photo[0].filename,
      status: 'pending'
    });

    res.status(201).json({ success: true, message: 'Merchant application submitted successfully', data: merchant });
  } catch (error) {
    console.error('Merchant Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const shop = await Shop.findOne({ merchantId: req.merchant._id });
    shop.offers = shop.offers.filter(o => o._id.toString() !== req.params.id);
    await shop.save();
    res.status(200).json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createWithdrawalRequest = async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;
    const merchant = req.merchant;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
    }

    if (merchant.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    }

    // Deduct balance immediately
    merchant.balance -= amount;
    await merchant.save();

    // Create pending MerchantTransaction
    const transaction = await MerchantTransaction.create({
      merchantId: merchant._id,
      userId: req.user._id,
      amount: amount,
      type: 'withdrawal',
      status: 'PENDING',
      bankDetails: bankDetails
    });

    res.status(201).json({ success: true, message: 'Withdrawal request submitted.', transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await MerchantTransaction.find({
      merchantId: req.merchant._id,
      type: 'withdrawal'
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: withdrawals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const submitSupportTicket = async (req, res) => {
  try {
    const { subject, description, category } = req.body;
    const complaint = await Complaint.create({
      userId: req.user._id,
      subject: subject || 'Support Ticket',
      description,
      category: category || 'Merchant Support',
      status: 'Pending'
    });
    res.status(201).json({ success: true, message: 'Support ticket submitted.', complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSupportTickets = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const uploadKyc = async (req, res) => {
  try {
    if (!req.files || !req.files.aadhar || !req.files.pan || !req.files.photo) {
      return res.status(400).json({ success: false, message: 'All KYC documents are required (aadhar, pan, photo)' });
    }

    const merchant = await Merchant.findOne({ userId: req.user._id });
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant profile not found' });
    }

    merchant.aadharUrl = req.files.aadhar[0].filename;
    merchant.panUrl = req.files.pan[0].filename;
    merchant.photoUrl = req.files.photo[0].filename;
    merchant.status = 'pending'; // Reset status to pending when files are uploaded
    await merchant.save();

    res.status(200).json({ success: true, message: 'KYC documents uploaded successfully', data: merchant });
  } catch (error) {
    console.error('KYC Upload Error:', error);
    res.status(500).json({ success: false, message: 'Server error during KYC upload' });
  }
};

const uploadShopImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided.' });

    // Build the publicly accessible URL path
    const imageUrl = `/uploads/shop/${req.file.filename}`;

    // Update the shop's imageUrl in DB
    const shop = await Shop.findOneAndUpdate(
      { merchantId: req.merchant._id },
      { imageUrl },
      { new: true }
    );

    res.status(200).json({ success: true, imageUrl, shop });
  } catch (err) {
    console.error('Shop Image Upload Error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload shop image.' });
  }
};

module.exports = {
  getStatus,
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
  registerMerchant,
  createWithdrawalRequest,
  getWithdrawals,
  submitSupportTicket,
  getSupportTickets,
  uploadKyc,
  uploadShopImage
};
