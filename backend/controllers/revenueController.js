const Revenue = require('../models/Revenue');
const Merchant = require('../models/Merchant');
const TokenTransaction = require('../models/TokenTransaction');

const getSummary = async (req, res) => {
  try {
    const { type } = req.query; // weekly | monthly
    const limit = type === 'monthly' ? 30 : 7;
    const revs = await Revenue.find().sort({ date: -1 }).limit(limit);

    let totalRevenue = 0, platformCommission = 0, tokenSalesRevenue = 0, merchantPayouts = 0;
    revs.forEach(r => {
      totalRevenue += r.netRevenue;
      platformCommission += r.platformCommission;
      tokenSalesRevenue += r.totalTokenSales;
      merchantPayouts += r.merchantPayouts;
    });

    res.status(200).json({ success: true, totalRevenue, platformCommission, tokenSalesRevenue, merchantPayouts });
  } catch (err) { res.status(500).json({ success: false }); }
};

const getChart = async (req, res) => {
  try {
    const { type } = req.query; // weekly | monthly
    const limit = type === 'monthly' ? 30 : 7;
    const data = await Revenue.find().sort({ date: -1 }).limit(limit);
    
    const labels = data.map(d => d.date.toISOString().split('T')[0]).reverse();
    const values = data.map(d => d.netRevenue).reverse();

    // Fallback data if empty
    if(labels.length === 0) {
      res.status(200).json({ success: true, labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], data: [0, 0, 0, 0, 0, 0, 0] });
    } else {
      res.status(200).json({ success: true, labels, data: values });
    }
  } catch (err) { res.status(500).json({ success: false }); }
};

const getTokenAnalytics = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: [10, 20, 30] }); // Placeholder implementation
  } catch (err) { res.status(500).json({ success: false }); }
};

const getMerchantRankings = async (req, res) => {
  try {
    const rankings = await Merchant.find({ status: 'approved' }).sort({ totalEarnings: -1 }).limit(5).select('businessName totalEarnings totalOrders');
    res.status(200).json({ success: true, data: rankings });
  } catch (err) { res.status(500).json({ success: false }); }
};

const getMerchantOrders = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch Token Transactions
    const tokenOrders = await TokenTransaction.find({ merchantId: id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
      
    // Fetch Shop Transactions (Wallet/Razorpay)
    const merchant = await Merchant.findById(id);
    let shopOrders = [];
    if (merchant) {
      const shops = await require('../models/Shop').find({ merchantId: merchant.userId });
      const shopIds = shops.map(s => s._id);
      shopOrders = await require('../models/ShopTransaction').find({ shopId: { $in: shopIds } })
        .populate('userId', 'name email')
        .sort({ timestamp: -1 })
        .limit(50);
    }
    
    // Format and combine
    const formattedTokenOrders = tokenOrders.map(t => ({
      _id: t._id,
      userId: t.userId,
      amount: t.amount,
      type: t.type,
      paymentMethod: 'Token',
      createdAt: t.createdAt
    }));
    
    const formattedShopOrders = shopOrders.map(s => ({
      _id: s._id,
      userId: s.userId,
      amount: s.amount,
      type: 'purchase',
      paymentMethod: 'Wallet/Razorpay',
      createdAt: s.timestamp
    }));
    
    const allOrders = [...formattedTokenOrders, ...formattedShopOrders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);

    res.status(200).json({ success: true, data: allOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getSummary, getChart, getTokenAnalytics, getMerchantRankings, getMerchantOrders };
