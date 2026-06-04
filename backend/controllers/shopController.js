const Shop = require('../models/Shop');
const ShopTransaction = require('../models/ShopTransaction');
const TokenTransaction = require('../models/TokenTransaction');
const Wallet = require('../models/Wallet');
const User = require('../models/User');

// @desc    Register a new shop (Admin only)
// @route   POST /api/shops/register
// @access  Private (Admin)
const registerShop = async (req, res) => {
  const { merchantId, shopName, category, description, imageUrl } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can register shops.' });
  }

  try {
    const merchant = await User.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant user not found.' });
    }

    if (merchant.role !== 'merchant') {
      merchant.role = 'merchant';
      await merchant.save();
    }

    const newShop = new Shop({
      merchantId,
      shopName,
      category,
      description,
      imageUrl
    });

    await newShop.save();

    res.status(201).json({
      success: true,
      message: 'Shop registered successfully.',
      shop: newShop
    });
  } catch (error) {
    console.error('Register Shop Error:', error);
    res.status(500).json({ message: 'Server error registering shop.' });
  }
};

// @desc    Get all active shops
// @route   GET /api/shops
// @access  Private (All)
const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find().populate({
      path: 'merchantId',
      select: 'businessName status phone address userId',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    });
    res.status(200).json({ success: true, shops });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching shops.' });
  }
};

// @desc    Pay at a shop using wallet balance
// @route   POST /api/shops/pay
// @access  Private (User)
const payShop = async (req, res) => {
  const { shopId, amount, paymentMethod, paymentId } = req.body;

  if (!shopId || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Valid Shop ID and amount are required.' });
  }

  try {
    const Merchant = require('../models/Merchant');

    let shop = null;
    let merchantUserIdForWallet = null;

    // Strategy 1: shopId is a Shop._id
    shop = await Shop.findById(shopId).catch(() => null);
    if (shop) {
      // shop.merchantId could be a User._id or a Merchant._id depending on how the shop was registered
      // Try to resolve it as a Merchant doc first
      const merchantDoc = await Merchant.findById(shop.merchantId).catch(() => null);
      if (merchantDoc) {
        merchantUserIdForWallet = merchantDoc.userId;
      } else {
        // merchantId is probably a User._id directly
        merchantUserIdForWallet = shop.merchantId;
      }
    }

    // Strategy 2: shopId is a Merchant._id → find their shop
    if (!shop) {
      const merchantDoc = await Merchant.findById(shopId).catch(() => null);
      if (merchantDoc) {
        shop = await Shop.findOne({ merchantId: merchantDoc._id });
        merchantUserIdForWallet = merchantDoc.userId;
      }
    }

    // Strategy 3: shopId is a User._id (merchant user) → find Merchant → find Shop
    if (!shop) {
      const merchantDoc = await Merchant.findOne({ userId: shopId });
      if (merchantDoc) {
        shop = await Shop.findOne({ merchantId: merchantDoc._id });
        if (!shop) {
          // Shop.merchantId might be the userId directly
          shop = await Shop.findOne({ merchantId: shopId });
        }
        merchantUserIdForWallet = shopId;
      }
    }

    // Strategy 4: shopId is stored directly in Shop.merchantId as a User._id
    if (!shop) {
      shop = await Shop.findOne({ merchantId: shopId });
      if (shop) {
        merchantUserIdForWallet = shopId;
      }
    }

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found. Please verify merchant QR.' });
    }

    // Final fallback for merchantUserIdForWallet
    if (!merchantUserIdForWallet) {
      const merchantDoc = await Merchant.findById(shop.merchantId).catch(() => null);
      merchantUserIdForWallet = merchantDoc?.userId || shop.merchantId;
    }

    console.log('PayShop resolved → Shop:', shop._id, 'MerchantWalletUser:', merchantUserIdForWallet);

    const userWallet = await Wallet.findOne({ userId: req.user.id });
    if (!userWallet) {
      return res.status(404).json({ message: 'User wallet not found.' });
    }

    const isRazorpay = paymentMethod === 'razorpay';
    if (isRazorpay && !paymentId) {
      return res.status(400).json({ message: 'Payment ID is required for Razorpay validation.' });
    }

    if (!isRazorpay && userWallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance.' });
    }

    let merchantWallet = await Wallet.findOne({ userId: merchantUserIdForWallet });
    if (!merchantWallet) {
      merchantWallet = new Wallet({ userId: merchantUserIdForWallet, balance: 0, transactions: [] });
    }

    // Find Admin User and Wallet
    const adminUser = await require('../models/User').findOne({ role: 'admin' });
    if (!adminUser) {
      return res.status(500).json({ message: 'System error: Admin account not found.' });
    }
    let adminWallet = await Wallet.findOne({ userId: adminUser._id });
    if (!adminWallet) {
      adminWallet = new Wallet({ userId: adminUser._id, balance: 100000, transactions: [] }); // Start admin with some balance for cashbacks
    }

    const cashbackAmount = Math.floor(amount * 0.05); // 5% cashback
    const commissionAmount = Math.floor(amount * 0.02); // 2% commission
    const merchantReceives = amount - commissionAmount;

    // 1. Process User
    if (isRazorpay) {
      userWallet.transactions.push({
        type: 'debit',
        amount,
        description: `Payment at ${shop.shopName} (via Razorpay ID: ${paymentId})`,
        date: new Date()
      });
      // Note: We do NOT subtract the amount from userWallet.balance because they paid Razorpay.
    } else {
      userWallet.balance -= amount; // Deduct full amount from wallet
      userWallet.transactions.push({
        type: 'debit',
        amount,
        description: `Payment at ${shop.shopName}`,
        date: new Date()
      });
    }
    
    // Add cashback incentive to user wallet
    userWallet.balance += cashbackAmount; // Add 5% cashback
    userWallet.transactions.push({
      type: 'credit',
      amount: cashbackAmount,
      description: `5% Cashback for payment at ${shop.shopName}`,
      date: new Date()
    });
    await userWallet.save();

    // 2. Process Merchant (receives amount - 2% commission)
    merchantWallet.balance += merchantReceives;
    merchantWallet.transactions.push({
      type: 'credit',
      amount: merchantReceives,
      description: `Payment from customer (after 2% platform fee)`,
      date: new Date()
    });
    await merchantWallet.save();

    // 3. Process Admin
    adminWallet.balance -= cashbackAmount; // Admin funds cashback
    adminWallet.transactions.push({
      type: 'debit',
      amount: cashbackAmount,
      description: `Funded 5% cashback to user for shop payment`,
      date: new Date()
    });
    
    adminWallet.balance += commissionAmount; // Admin receives commission
    adminWallet.transactions.push({
      type: 'credit',
      amount: commissionAmount,
      description: `2% platform fee from ${shop.shopName}`,
      date: new Date()
    });
    await adminWallet.save();

    // Record Transaction
    const shopTx = new ShopTransaction({
      shopId: shop._id,
      userId: req.user.id,
      amount,
      paymentId: paymentId || `WAL-TXN-${Date.now()}`,
      paymentMethod: isRazorpay ? 'razorpay' : 'wallet',
      status: 'SUCCESS',
    });
    await shopTx.save();

    res.status(200).json({
      success: true,
      message: 'Payment successful.',
      transaction: shopTx
    });
  } catch (error) {
    console.error('Pay Shop Error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error processing shop payment.', error: error.message });
  }
};

// @desc    Get transactions for a specific merchant's shop
// @route   GET /api/shops/merchant-transactions
// @access  Private (Merchant)
const getMerchantTransactions = async (req, res) => {
  if (req.user.role !== 'merchant' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  try {
    // Find shop owned by merchant
    const shop = await Shop.findOne({ merchantId: req.user.id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop associated with this merchant account.' });
    }

    const transactions = await ShopTransaction.find({ shopId: shop._id })
      .populate('userId', 'name phone')
      .sort({ timestamp: -1 });

    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const salesByDay = {};
    last7Days.forEach(day => salesByDay[day] = 0);

    transactions.forEach(tx => {
      const day = new Date(tx.timestamp).toISOString().split('T')[0];
      if (salesByDay[day] !== undefined) {
        salesByDay[day] += tx.amount;
      }
    });

    const salesGrowth = {
      labels: last7Days.map(d => d.slice(5)),
      data: last7Days.map(d => salesByDay[d])
    };

    const tokenTransactions = await TokenTransaction.find({ shopId: shop._id, type: 'REDEEM' });
    const tokensRedeemed = tokenTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    res.status(200).json({ 
      success: true, 
      shop, 
      transactions,
      analytics: {
        totalSales: transactions.reduce((sum, tx) => sum + tx.amount, 0),
        totalOrders: transactions.length,
        tokensRedeemed,
        salesGrowth
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching merchant transactions.' });
  }
};

// @desc    Merchant scans/accepts tokens from a user
// @route   POST /api/shops/accept-tokens
// @access  Private (Merchant)
const acceptTokens = async (req, res) => {
  const { customerId, amount } = req.body;

  if (req.user.role !== 'merchant') {
    return res.status(403).json({ message: 'Only merchants can accept tokens.' });
  }

  if (!customerId || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Valid customer ID and amount are required.' });
  }

  try {
    const shop = await Shop.findOne({ merchantId: req.user.id });
    if (!shop || !shop.isActive) {
      return res.status(404).json({ message: 'Shop not found or inactive.' });
    }

    const userWallet = await Wallet.findOne({ userId: customerId });
    if (!userWallet || userWallet.balance < amount) {
      return res.status(400).json({ message: 'Customer has insufficient token balance.' });
    }

    let merchantWallet = await Wallet.findOne({ userId: req.user.id });
    if (!merchantWallet) {
      merchantWallet = new Wallet({ userId: req.user.id, balance: 0, transactions: [] });
    }

    // Deduct tokens from user
    userWallet.balance -= amount;
    userWallet.transactions.push({
      type: 'debit',
      amount,
      description: `Tokens redeemed at ${shop.shopName}`,
      date: new Date()
    });
    await userWallet.save();

    // Credit merchant
    merchantWallet.balance += amount;
    merchantWallet.transactions.push({
      type: 'credit',
      amount,
      description: `Tokens received from customer`,
      date: new Date()
    });
    await merchantWallet.save();

    // Record Shop Transaction
    const shopTx = new ShopTransaction({
      shopId: shop._id,
      userId: customerId,
      amount,
      status: 'SUCCESS'
    });
    await shopTx.save();

    // Record Token Economy Transaction
    const tokenTx = new TokenTransaction({
      userId: customerId,
      shopId: shop._id,
      type: 'REDEEM',
      amount,
      platformCommission: 0, // In this model, merchant gets 100% of redeemed tokens (or you can adjust logic)
      merchantEarnings: amount
    });
    await tokenTx.save();

    res.status(200).json({
      success: true,
      message: 'Tokens accepted successfully.',
      transaction: shopTx
    });
  } catch (error) {
    console.error('Accept Tokens Error:', error);
    res.status(500).json({ message: 'Server error processing token payment.' });
  }
};


module.exports = {
  registerShop,
  getAllShops,
  payShop,
  getMerchantTransactions,
  acceptTokens
};
