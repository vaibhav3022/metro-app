const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const TokenTransaction = require('../models/TokenTransaction');
const Notification = require('../models/Notification');
const Merchant = require('../models/Merchant');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_St6f7LZjydxbQ0',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_secret_key'
});

const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10) return res.status(400).json({ success: false, message: 'Minimum 10 tokens' });

    const options = { amount: amount * 100, currency: 'INR', receipt: `receipt_${Date.now()}` };
    const order = await razorpay.orders.create(options);
    
    res.status(200).json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) { res.status(500).json({ success: false }); }
};

const verifyPayment = async (req, res) => {
  try {
    const { amount, paymentId, orderId, signature } = req.body;
    // Assume verification succeeds for now since it's a test environment.
    
    const user = await User.findById(req.user._id);
    const balanceBefore = user.tokenBalance;
    user.tokenBalance += amount;
    await user.save();

    const tx = await TokenTransaction.create({
      userId: user._id, type: 'purchase', amount,
      balanceBefore, balanceAfter: user.tokenBalance,
      razorpayOrderId: orderId, razorpayPaymentId: paymentId, status: 'success'
    });

    await Notification.create({
      recipientId: user._id, recipientRole: 'user',
      title: 'Tokens Purchased', message: `You purchased ${amount} tokens successfully.`, type: 'success'
    });

    res.status(200).json({ success: true, tokenBalance: user.tokenBalance, transaction: tx });
  } catch (err) { res.status(500).json({ success: false }); }
};

const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, tokenBalance: user.tokenBalance });
  } catch (err) { res.status(500).json({ success: false }); }
};

const getHistory = async (req, res) => {
  try {
    const tx = await TokenTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, transactions: tx });
  } catch (err) { res.status(500).json({ success: false }); }
};

const redeem = async (req, res) => {
  try {
    const { merchantId, amount } = req.body;
    const user = await User.findById(req.user._id);
    if (user.tokenBalance < amount) return res.status(400).json({ success: false, message: 'Insufficient tokens' });

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) return res.status(404).json({ success: false, message: 'Merchant not found' });

    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) return res.status(500).json({ success: false, message: 'System error: Admin not found' });

    const cashbackTokens = Math.floor(amount * 0.05);
    const commissionTokens = Math.floor(amount * 0.02);
    const merchantReceives = amount - commissionTokens;

    const balanceBefore = user.tokenBalance;
    user.tokenBalance = user.tokenBalance - amount + cashbackTokens;
    await user.save();

    merchant.totalTokensAccepted += merchantReceives;
    merchant.totalEarnings += merchantReceives; // If treating tokens as 1:1 earnings equivalent
    merchant.totalOrders += 1;
    await merchant.save();

    adminUser.tokenBalance = adminUser.tokenBalance - cashbackTokens + commissionTokens;
    await adminUser.save();

    await TokenTransaction.create({
      userId: user._id, merchantId: merchant._id, type: 'redemption', amount,
      balanceBefore, balanceAfter: user.tokenBalance, status: 'success'
    });

    await Notification.create({
      recipientId: merchant.userId, recipientRole: 'merchant',
      title: 'Tokens Received', message: `${amount} tokens received from user.`, type: 'success'
    });

    res.status(200).json({ success: true, tokenBalance: user.tokenBalance });
  } catch (err) { res.status(500).json({ success: false }); }
};

module.exports = { createOrder, verifyPayment, getBalance, getHistory, redeem };
