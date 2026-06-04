const Wallet = require('../models/Wallet');
const TokenTransaction = require('../models/TokenTransaction');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

    const sortedTransactions = wallet.transactions ? [...wallet.transactions].sort((a, b) => b.date - a.date) : [];

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

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
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

    const rechargeAmount = parseFloat(amount);
    wallet.balance += rechargeAmount;

    const newTransaction = {
      type: 'credit',
      amount: rechargeAmount,
      description: `Wallet Recharge (ID: ${paymentId || 'PAY-' + Date.now()})`,
      date: new Date()
    };

    wallet.transactions.push(newTransaction);
    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'Wallet credited successfully.',
      balance: wallet.balance,
      transaction: wallet.transactions[wallet.transactions.length - 1]
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

    wallet.transactions.push({
      type: 'debit',
      amount: debitAmount,
      description: `Metro Ticket booking: ${ticketId || 'PMA-PASS'}`,
      date: new Date()
    });

    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'Wallet debited successfully.',
      balance: wallet.balance,
      transaction: wallet.transactions[wallet.transactions.length - 1]
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

    // Sort transactions by date newest first
    const sortedTransactions = [...wallet.transactions].sort((a, b) => b.date - a.date);

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

    wallet.transactions.push({
      type: 'credit',
      amount: tokensToBuy,
      description: `Purchased ${tokensToBuy} Tokens (ID: ${paymentId || 'PAY-' + Date.now()})`,
      date: new Date()
    });
    await wallet.save();

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

module.exports = {
  getWalletBalance,
  createRazorpayOrder,
  addMoney,
  deductMoney,
  getTransactionHistory,
  buyTokens
};
