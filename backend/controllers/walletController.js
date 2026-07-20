const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const TokenTransaction = require('../models/TokenTransaction');
const Merchant = require('../models/Merchant');
const MerchantTransaction = require('../models/MerchantTransaction');
const { createBreaker } = require('../utils/circuitBreaker');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

async function callRazorpayOrderCreate(options) {
  return await razorpay.orders.create(options);
}
const razorpayBreaker = createBreaker(callRazorpayOrderCreate);
razorpayBreaker.fallback(() => ({ id: 'fallback_order_id', amount: 0, currency: 'INR' }));

// @desc    Get current wallet balance
// @route   GET /api/wallet/balance
// @access  Private
const getWalletBalance = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user.id });
    
    if (!wallet) {
      wallet = new Wallet({
        userId: req.user.id,
        balance: 0,
        transactions: []
      });
      await wallet.save();
    }

    // Fetch new transactions
    const newTx = await WalletTransaction.find({ walletId: wallet._id }).lean();
    const mappedNewTx = newTx.map(t => ({
      _id: t._id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      date: t.createdAt,
      referenceType: t.referenceType
    }));

    let allTransactions = [...(wallet.transactions || []), ...mappedNewTx];
    const sortedTransactions = allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      balance: wallet.balance,
      transactions: sortedTransactions
    });
  } catch (error) {
    console.error('Get Wallet Balance Error:', error);
    res.status(500).json({ message: 'Server error retrieving wallet balances.' });
  }
};

// @desc    Create a Razorpay Order for wallet top-up
// @route   POST /api/wallet/create-razorpay-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ message: 'Amount is required to create order.' });
  }

  try {
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_wallet_${Date.now()}`
    };

    let order;
    if (process.env.RAZORPAY_KEY_SECRET === 'puneMetroRazorSecret123') {
      // Mock order creation for development/testing if dummy secret is used
      order = {
        id: `order_mock_${Date.now()}`,
        amount: options.amount,
        currency: options.currency
      };
    } else {
      order = await razorpayBreaker.fire(options);
    }

    res.status(200).json({
      success: true,
      orderId: order.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Create Razorpay Order Error:', error);
    res.status(500).json({ message: 'Server error creating Razorpay order.' });
  }
};

// @desc    Top up wallet balance
// @route   POST /api/wallet/add-money
// @access  Private
const addMoney = async (req, res) => {
  const { amount, paymentId } = req.body;

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'A valid recharge amount is required.' });
  }

  if (!paymentId) {
    return res.status(400).json({ message: 'Payment ID missing.' });
  }

  try {
    let wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      wallet = new Wallet({
        userId: req.user.id,
        balance: 0,
        transactions: []
      });
    }

    const baseAmount = parseFloat(amount);
    const bonusAmount = Math.floor(baseAmount * 0.05); // 5% extra from admin
    const totalCredit = baseAmount + bonusAmount;

    wallet.balance += totalCredit;
    await wallet.save();

    const tx = await WalletTransaction.create({
      walletId: wallet._id,
      userId: req.user.id,
      amount: totalCredit,
      type: 'credit',
      description: `Wallet Recharge + 5% Synergia Bonus (ID: ${paymentId || 'PAY-' + Date.now()})`,
      referenceType: 'WALLET_TOPUP'
    });

    res.status(200).json({
      success: true,
      message: 'Wallet credited successfully.',
      balance: wallet.balance,
      transaction: { ...tx.toObject(), date: tx.createdAt }
    });
  } catch (error) {
    console.error('Wallet Add Money Error:', error);
    res.status(500).json({ message: 'Server error processing wallet recharge.' });
  }
};

// @desc    Deduct money from wallet for ticket bookings
// @route   POST /api/wallet/deduct-money
// @access  Private
const deductMoney = async (req, res) => {
  const { amount, ticketId } = req.body;

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'A valid debit amount is required.' });
  }

  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet || wallet.balance < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient wallet balance.' });
    }

    const debitAmount = parseFloat(amount);
    wallet.balance -= debitAmount;
    await wallet.save();

    const tx = await WalletTransaction.create({
      walletId: wallet._id,
      userId: req.user.id,
      amount: debitAmount,
      type: 'debit',
      description: `Metro Ticket booking: ${ticketId || 'PMA-PASS'}`,
      referenceType: 'TICKET_BOOKING'
    });

    res.status(200).json({
      success: true,
      message: 'Wallet debited successfully.',
      balance: wallet.balance,
      transaction: { ...tx.toObject(), date: tx.createdAt }
    });
  } catch (error) {
    console.error('Wallet Deduct Money Error:', error);
    res.status(500).json({ message: 'Server error processing wallet debit.' });
  }
};

// @desc    Get wallet ledger transactions list
// @route   GET /api/wallet/transactions
// @access  Private
const getTransactionHistory = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });
    
    if (!wallet) {
      return res.status(200).json({ success: true, transactions: [] });
    }

    // Fetch new transactions
    const newTx = await WalletTransaction.find({ walletId: wallet._id }).lean();
    const mappedNewTx = newTx.map(t => ({
      _id: t._id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      date: t.createdAt,
      referenceType: t.referenceType
    }));

    let allTransactions = [...(wallet.transactions || []), ...mappedNewTx];
    const sortedTransactions = allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      transactions: sortedTransactions
    });
  } catch (error) {
    console.error('Wallet Transaction History Error:', error);
    res.status(500).json({ message: 'Server error retrieving transaction history.' });
  }
};

// @desc    Buy Tokens directly from the system
// @route   POST /api/wallet/buy-tokens
// @access  Private
const buyTokens = async (req, res) => {
  const { amount, paymentId } = req.body;

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'A valid token amount is required.' });
  }

  try {
    let wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet) {
      wallet = new Wallet({ userId: req.user.id, balance: 0, transactions: [] });
    }

    const tokensToBuy = parseFloat(amount);
    wallet.balance += tokensToBuy;
    await wallet.save();

    const tx = await WalletTransaction.create({
      walletId: wallet._id,
      userId: req.user.id,
      amount: tokensToBuy,
      type: 'credit',
      description: `Purchased ${tokensToBuy} Tokens (ID: ${paymentId || 'PAY-' + Date.now()})`,
      referenceType: 'TOKEN_PURCHASE'
    });

    // Create TokenTransaction record for admin metrics
    const tokenTx = new TokenTransaction({
      userId: req.user.id,
      type: 'PURCHASE',
      amount: tokensToBuy,
      platformCommission: tokensToBuy, // All revenue goes to platform since it's a purchase
      merchantEarnings: 0
    });
    await tokenTx.save();

    res.status(200).json({
      success: true,
      message: 'Tokens purchased successfully.',
      balance: wallet.balance
    });
  } catch (error) {
    console.error('Buy Tokens Error:', error);
    res.status(500).json({ message: 'Server error processing token purchase.' });
  }
};

const processQRPayment = async (req, res) => {
  const { qrToken, amount } = req.body;

  if (!qrToken) return res.status(400).json({ message: 'QR Token is required.' });
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return res.status(400).json({ message: 'Valid amount is required.' });

  try {
    const merchant = await Merchant.findOne({ qrCodeToken: qrToken });
    if (!merchant) return res.status(404).json({ message: 'Invalid QR Code or Merchant not found.' });
    if (merchant.status !== 'approved') return res.status(400).json({ message: 'Merchant account is not active.' });

    const wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet || wallet.balance < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient wallet balance.' });
    }

    const payAmount = parseFloat(amount);
    
    // Deduct from user
    wallet.balance -= payAmount;
    await wallet.save();
    
    await WalletTransaction.create({
      walletId: wallet._id,
      userId: req.user.id,
      amount: payAmount,
      type: 'debit',
      description: `Paid to ${merchant.businessName}`,
      referenceType: 'QR_PAYMENT'
    });

    // Fetch settings for commission rate
    const SystemSettings = require('../models/SystemSettings');
    const settings = await SystemSettings.findOne();
    const commissionRate = settings ? settings.commissionRate : 2; // Default to 2%
    const commissionAmount = payAmount * (commissionRate / 100);
    const netAmount = payAmount - commissionAmount;

    // Credit to merchant (net amount after commission)
    merchant.balance = (merchant.balance || 0) + netAmount;
    merchant.totalEarnings = (merchant.totalEarnings || 0) + netAmount;
    await merchant.save();

    await MerchantTransaction.create({
      merchantId: merchant._id,
      userId: req.user.id,
      amount: netAmount,
      grossAmount: payAmount,
      commissionFee: commissionAmount,
      type: 'qr_payment',
      status: 'SUCCESS'
    });

    res.status(200).json({ success: true, message: `Payment of ₹${payAmount} successful to ${merchant.businessName} (Net: ₹${netAmount.toFixed(2)})` });
  } catch (error) {
    console.error('QR Payment Error:', error);
    res.status(500).json({ message: 'Server error processing QR payment.' });
  }
};

// @desc    Retrieve cashback history for user
// @route   GET /api/wallet/cashback-history
// @access  Private
const getCashbackHistory = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });
    
    if (!wallet) {
      return res.status(200).json({ success: true, transactions: [] });
    }

    const newTx = await WalletTransaction.find({ walletId: wallet._id }).lean();
    const mappedNewTx = newTx.map(t => ({
      _id: t._id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      date: t.createdAt,
      referenceType: t.referenceType
    }));

    let allTransactions = [...(wallet.transactions || []), ...mappedNewTx];
    
    // Filter only those containing "Cashback" in description
    const cashbackTransactions = allTransactions.filter(tx => 
      tx.description && tx.description.toLowerCase().includes('cashback')
    );

    const sortedTransactions = cashbackTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ success: true, transactions: sortedTransactions });
  } catch (error) {
    console.error('Fetch Cashback History Error:', error);
    res.status(500).json({ message: 'Server error retrieving cashback history.' });
  }
};

module.exports = {
  getWalletBalance,
  createRazorpayOrder,
  addMoney,
  deductMoney,
  getTransactionHistory,
  buyTokens,
  processQRPayment,
  getCashbackHistory
};
