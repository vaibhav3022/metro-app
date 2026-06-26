const GiftCard = require('../models/GiftCard');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'dhotrev384@gmail.com', pass: 'uqvjsavnkzrxreen' }
});

function generateRandomString(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// @desc    Create Razorpay Order for Gift Card
// @route   POST /api/giftcard/create-order
// @access  Private
const createGiftCardOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Check role
    const sender = await User.findById(req.user.id);
    if (!sender || (sender.role !== 'member' && sender.role !== 'admin')) {
      return res.status(403).json({ message: 'Only Members can buy and send Gift Cards. Please upgrade your membership.' });
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'A valid gift card amount is required.' });
    }

    const options = {
      amount: Math.round(parseFloat(amount) * 100), // in paise
      currency: "INR",
      receipt: `receipt_giftcard_${Date.now()}`
    };

    let order;
    if (process.env.RAZORPAY_KEY_SECRET === 'puneMetroRazorSecret123') {
      order = { id: `order_mock_${Date.now()}`, amount: options.amount, currency: options.currency };
    } else {
      order = await razorpayBreaker.fire(options);
    }

    res.status(200).json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error('Gift Card Razorpay Error:', error);
    res.status(500).json({ message: 'Error creating order. Please ensure Razorpay keys are valid.' });
  }
};

// @desc    Create a new gift card (after successful payment)
// @route   POST /api/giftcard/create
// @access  Private
const createGiftCard = async (req, res) => {
  try {
    const { amount, receiverEmail, message, paymentId } = req.body;

    // Get sender name and check role
    const sender = await User.findById(req.user.id);
    if (!sender || (sender.role !== 'member' && sender.role !== 'admin')) {
      return res.status(403).json({ message: 'Only Members can buy and send Gift Cards. Please upgrade your membership.' });
    }

    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required.' });
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'A valid gift card amount is required.' });
    }

    const giftAmount = parseFloat(amount);
    const senderName = sender ? sender.name : 'Metro User';

    // Generate unique cardId
    let cardId = generateRandomString(8);
    while (await GiftCard.findOne({ cardId })) {
      cardId = generateRandomString(8);
    }
    
    // Generate PIN and hash it
    const pin = generateRandomString(8);
    const hashedPin = await bcrypt.hash(pin, 10);

    // Set expiry strictly to 6 months from now
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);

    const giftCard = await GiftCard.create({
      cardId,
      hashedPin,
      senderId: req.user.id,
      senderName,
      amount: giftAmount,
      expiresAt
    });

    res.status(201).json({
      success: true,
      message: 'Gift card purchased successfully.',
      giftCard: {
        ...giftCard.toObject(),
        pin // Return raw pin ONLY once here so buyer can see it if needed, or we just rely on the share flow.
      }
    });
  } catch (error) {
    console.error('Create Gift Card Error:', error);
    res.status(500).json({ message: 'Server error creating gift card.' });
  }
};

// @desc    Send an already purchased gift card to a friend
// @route   POST /api/giftcard/send
// @access  Private
const sendGiftCard = async (req, res) => {
  try {
    const { cardId, receiverEmail, message } = req.body;
    
    if (!cardId) {
      return res.status(400).json({ message: 'Gift Card identifier is missing.' });
    }

    if (!receiverEmail) {
      return res.status(400).json({ message: 'Receiver email is required.' });
    }

    // Look for either cardId or the old code field for backward compatibility
    const giftCard = await GiftCard.findOne({ 
      $or: [{ cardId: cardId }, { code: cardId }], 
      senderId: req.user.id 
    });
    
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found or you do not have permission.' });
    }

    if (giftCard.status !== 'active') {
      return res.status(400).json({ message: 'Only active gift cards can be sent.' });
    }

    // If it's an old document without cardId, migrate it so save() doesn't fail validation
    if (!giftCard.cardId) {
      giftCard.cardId = giftCard.code || `MIGRATE-${Date.now()}`;
    }

    giftCard.receiverEmail = receiverEmail.toLowerCase().trim();
    if (message) giftCard.message = message;
    
    await giftCard.save();

    // Send Email
    const mailOptions = {
      from: '"Pune Metro" <dhotrev384@gmail.com>',
      to: giftCard.receiverEmail,
      subject: `🎁 You received a ₹${giftCard.amount} Pune Metro Gift Card!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #FF6B6B, #EE5A24); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Pune Metro Gift Card</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">You have received a special gift!</p>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <p style="font-size: 18px; color: #333;">Hi there,</p>
            <p style="font-size: 16px; color: #555;"><strong>${giftCard.senderName}</strong> has sent you a Pune Metro Digital Gift Card worth <strong>₹${giftCard.amount}</strong>.</p>
            ${giftCard.message ? `<p style="font-size: 16px; color: #555; font-style: italic; background: #fff; padding: 15px; border-left: 4px solid #EE5A24;">"${giftCard.message}"</p>` : ''}
            <div style="margin: 30px 0; text-align: center;">
              <p style="font-size: 14px; color: #888; margin-bottom: 5px;">Your Gift Card Code</p>
              <div style="background-color: #fff; border: 2px dashed #00C9A7; display: inline-block; padding: 15px 25px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #333;">
                ${giftCard.cardId}-********
              </div>
            </div>
            <p style="font-size: 14px; color: #666; text-align: center;">Ask the sender for the secret PIN, then go to Smart Card > Gift Cards and click Redeem in the Pune Metro App.</p>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error('Failed to send gift card email:', mailErr);
    }

    res.status(200).json({ success: true, message: 'Gift card sent successfully', giftCard });
  } catch (error) {
    console.error('Send Gift Card Error:', error);
    res.status(500).json({ message: 'Server error sending gift card.' });
  }
};

// @desc    Redeem a gift card by code (adds amount to receiver's wallet)
// @route   POST /api/giftcard/redeem
// @access  Private
const redeemGiftCard = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || !code.includes('-')) {
      return res.status(400).json({ message: 'Invalid gift card code format.' });
    }

    const [cardId, pin] = code.split('-');

    const giftCard = await GiftCard.findOne({ cardId });

    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found.' });
    }

    // Verify PIN
    const isMatch = await bcrypt.compare(pin, giftCard.hashedPin);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid gift card code (PIN mismatch).' });
    }

    if (giftCard.status === 'redeemed') {
      return res.status(400).json({ message: 'This gift card has already been redeemed.' });
    }

    if (giftCard.status === 'expired' || new Date() > giftCard.expiresAt) {
      // Mark as expired if not already
      if (giftCard.status !== 'expired') {
        giftCard.status = 'expired';
        await giftCard.save();
      }
      return res.status(400).json({ message: 'This gift card has expired.' });
    }

    // Prevent sender from redeeming their own gift card
    if (giftCard.senderId.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot redeem your own gift card.' });
    }

    // Check if it's an Admin Promotional Gift Card
    const senderUser = await User.findById(giftCard.senderId);
    const redeemerUser = await User.findById(req.user.id);
    if (senderUser && senderUser.role === 'admin' && redeemerUser && redeemerUser.email === giftCard.receiverEmail) {
      return res.status(400).json({ message: 'This is a promotional gift for you to share! You cannot redeem it yourself. Please share the code with a friend.' });
    }

    // Credit to receiver's wallet
    let receiverWallet = await Wallet.findOne({ userId: req.user.id });
    if (!receiverWallet) {
      receiverWallet = new Wallet({
        userId: req.user.id,
        balance: 0,
        transactions: []
      });
    }

    receiverWallet.balance += giftCard.amount;
    receiverWallet.transactions.push({
      type: 'credit',
      amount: giftCard.amount,
      description: `Gift Card redeemed from ${giftCard.senderName} (${giftCard.code})`,
      date: new Date()
    });
    await receiverWallet.save();

    // Update gift card status
    giftCard.status = 'redeemed';
    giftCard.receiverId = req.user.id;
    giftCard.redeemedAt = new Date();
    await giftCard.save();

    res.status(200).json({
      success: true,
      message: 'Gift card redeemed successfully.',
      amount: giftCard.amount,
      balance: receiverWallet.balance
    });
  } catch (error) {
    console.error('Redeem Gift Card Error:', error);
    res.status(500).json({ message: 'Server error redeeming gift card.' });
  }
};

// @desc    Get gift cards sent by the current user
// @route   GET /api/giftcard/sent
// @access  Private
const getMyGiftCards = async (req, res) => {
  try {
    const giftCards = await GiftCard.find({ senderId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, giftCards });
  } catch (error) {
    console.error('Get Sent Gift Cards Error:', error);
    res.status(500).json({ message: 'Server error retrieving sent gift cards.' });
  }
};

// @desc    Get gift cards received (redeemed) by the current user
// @route   GET /api/giftcard/received
// @access  Private
const getReceivedGiftCards = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const email = user ? user.email : '';

    // Find gift cards sent to this user's email OR redeemed by this user
    const giftCards = await GiftCard.find({
      $or: [
        { receiverEmail: email },
        { receiverId: req.user.id }
      ]
    }).sort({ createdAt: -1 });

    const formattedCards = giftCards.map(gc => ({
      _id: gc._id,
      code: `${gc.cardId}-********`,
      receiverEmail: gc.receiverEmail,
      amount: gc.amount,
      status: gc.status,
      senderName: gc.senderName,
      createdAt: gc.createdAt
    }));

    res.status(200).json({ success: true, giftCards: formattedCards });
  } catch (error) {
    console.error('Get Received Gift Cards Error:', error);
    res.status(500).json({ message: 'Server error retrieving received gift cards.' });
  }
};

// @desc    Get a gift card by its code (preview before redeeming)
// @route   GET /api/giftcard/:code
// @access  Private
const getGiftCardByCode = async (req, res) => {
  try {
    const code = req.params.code;
    if (!code || !code.includes('-')) {
      return res.status(400).json({ message: 'Invalid code format.' });
    }
    
    const [cardId, pin] = code.split('-');
    const giftCard = await GiftCard.findOne({ cardId });
    
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found' });
    }

    const isMatch = await bcrypt.compare(pin, giftCard.hashedPin);
    if (!isMatch) {
      return res.status(404).json({ message: 'Gift card not found' });
    }

    // Check if expired
    if (giftCard.status === 'active' && new Date() > giftCard.expiresAt) {
      giftCard.status = 'expired';
      await giftCard.save();
    }

    res.status(200).json({
      success: true,
      giftCard: {
        amount: giftCard.amount,
        senderName: giftCard.senderName,
        status: giftCard.status,
        expiresAt: giftCard.expiresAt,
      }
    });
  } catch (error) {
    console.error('Get Gift Card By Code Error:', error);
    res.status(500).json({ message: 'Server error retrieving gift card.' });
  }
};

module.exports = {
  createGiftCardOrder,
  createGiftCard,
  sendGiftCard,
  redeemGiftCard,
  getMyGiftCards,
  getReceivedGiftCards,
  getGiftCardByCode
};
