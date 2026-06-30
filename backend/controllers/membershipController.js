const MembershipPlan = require('../models/MembershipPlan');
const UserMembership = require('../models/UserMembership');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const Razorpay = require('razorpay');
const { createBreaker } = require('../utils/circuitBreaker');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

async function callRazorpayOrderCreate(options) {
  return await razorpay.orders.create(options);
}
const razorpayBreaker = createBreaker(callRazorpayOrderCreate);
razorpayBreaker.fallback(() => ({ id: 'fallback_order_id', amount: 0, currency: 'INR' }));

// @desc    Create a new membership plan
// @route   POST /api/membership/plans
// @access  Private/Admin
const createPlan = async (req, res) => {
  try {
    const { name, price, durationDays, features } = req.body;
    
    if (!name || !price || !durationDays) {
      return res.status(400).json({ success: false, message: 'Name, price, and duration are required.' });
    }

    const plan = await MembershipPlan.create({
      name,
      price,
      durationDays,
      features: features || []
    });

    res.status(201).json({ success: true, plan });
  } catch (error) {
    console.error('Create Plan Error:', error);
    res.status(500).json({ success: false, message: 'Server error creating plan' });
  }
};

// @desc    Get all active membership plans
// @route   GET /api/membership/plans
// @access  Public
const getActivePlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true }).sort({ price: 1 });
    res.status(200).json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching plans' });
  }
};

// @desc    Create Razorpay Order for Membership
// @route   POST /api/membership/create-razorpay-order
// @access  Private
const createMembershipOrder = async (req, res) => {
  const { planId } = req.body;
  try {
    const plan = await MembershipPlan.findById(planId);
    if (!plan || !plan.isActive) return res.status(404).json({ message: 'Plan not found' });

    const options = {
      amount: Math.round(plan.price * 100),
      currency: "INR",
      receipt: `receipt_member_${Date.now()}`
    };

    let order;
    if (process.env.RAZORPAY_KEY_SECRET === 'puneMetroRazorSecret123') {
      order = { id: `order_mock_${Date.now()}`, amount: options.amount, currency: options.currency };
    } else {
      order = await razorpayBreaker.fire(options);
    }
    res.status(200).json({ success: true, orderId: order.id, key_id: process.env.RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ message: 'Error creating order. Please ensure Razorpay keys are valid.' });
  }
};

// @desc    Buy a membership plan via Razorpay payment ID
// @route   POST /api/membership/buy
// @access  Private
const buyMembership = async (req, res) => {
  try {
    const { planId, paymentId } = req.body;
    const userId = req.user.id;

    if (!paymentId) return res.status(400).json({ success: false, message: 'Payment ID is required.' });

    const plan = await MembershipPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ success: false, message: 'Plan not found or inactive.' });
    }

    // Check if user already has an active membership
    const activeMembership = await UserMembership.findOne({ userId, status: 'active' });
    if (activeMembership && !activeMembership.isExpired()) {
      return res.status(400).json({ success: false, message: 'You already have an active membership.' });
    }

    // Remove wallet deduction, assume Razorpay payment was successful via paymentId
    // We log it directly as a revenue transaction or just activate it.
    
    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Create User Membership
    const userMembership = await UserMembership.findOneAndUpdate(
      { userId },
      { 
        planId, 
        startDate, 
        endDate, 
        status: 'active' 
      },
      { new: true, upsert: true }
    );

    // Upgrade user role to 'member' if they are just a 'user'
    const user = await User.findById(userId);
    if (user.role === 'user') {
      user.role = 'member';
      await user.save();
    }

    res.status(200).json({ 
      success: true, 
      message: 'Membership activated successfully!',
      membership: userMembership,
      role: user.role
    });

  } catch (error) {
    console.error('Buy Membership Error:', error);
    res.status(500).json({ success: false, message: 'Server error processing membership' });
  }
};

// @desc    Get current user's membership details
// @route   GET /api/membership/my
// @access  Private
const getMyMembership = async (req, res) => {
  try {
    const membership = await UserMembership.findOne({ userId: req.user.id }).populate('planId');
    if (!membership) {
      return res.status(200).json({ success: true, membership: null });
    }

    if (membership.isExpired() && membership.status === 'active') {
      membership.status = 'expired';
      await membership.save();
      
      // Downgrade role if expired (optional, but requested in logic generally)
      const user = await User.findById(req.user.id);
      if (user.role === 'member') {
        user.role = 'user';
        await user.save();
      }
    }

    res.status(200).json({ success: true, membership });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching membership details' });
  }
};

module.exports = {
  createPlan,
  getActivePlans,
  createMembershipOrder,
  buyMembership,
  getMyMembership
};
