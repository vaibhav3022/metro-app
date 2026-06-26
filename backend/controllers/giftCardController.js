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
    
    // Generate a fresh PIN for the recipient to ensure security
    const newPin = generateRandomString(8);
    giftCard.hashedPin = await bcrypt.hash(newPin, 10);
    
    await giftCard.save();

    // Send Email
    const mailOptions = {
      from: '"Pune Metro" <dhotrev384@gmail.com>',
      to: giftCard.receiverEmail,
      subject: `🎁 You received a ₹${giftCard.amount} METRO GEIA Gift Card!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #E53935, #FF6B6B); padding: 28px 30px; text-align: center; color: white;">
            <img src="https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Pune_Metro_Logo.svg/1200px-Pune_Metro_Logo.svg.png" alt="Pune Metro Logo" style="height: 52px; width: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" />
            <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px;">METRO GEIA Gift Card</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Someone special sent you a gift! 🎁</p>
          </div>

          <!-- Body -->
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #333; margin-bottom: 8px;">Hi there,</p>
            <p style="font-size: 15px; color: #555; margin-bottom: 20px;">
              <strong style="color:#E53935;">${giftCard.senderName}</strong> has sent you a Pune Metro – METRO GEIA Gift Card worth
              <strong style="color:#00C9A7; font-size: 18px;">₹${giftCard.amount}</strong>.
              Use it to top up your Metro Wallet!
            </p>

            ${giftCard.message ? `<div style="background:#FFF5F5; border-left: 4px solid #E53935; padding: 14px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; color: #555; font-style: italic;">"${giftCard.message}"</div>` : ''}

            <!-- No code shown here - sender will share it separately -->
            <div style="background: #FFF8E1; border: 2px solid #FFC107; border-radius: 12px; padding: 22px; text-align: center; margin: 20px 0;">
              <p style="font-size: 22px; margin: 0 0 8px 0;">🔐</p>
              <p style="font-size: 15px; font-weight: bold; color: #333; margin: 0 0 6px 0;">Your secret gift code is on its way!</p>
              <p style="font-size: 14px; color: #666; margin: 0;">Ask <strong style="color:#E53935;">${giftCard.senderName}</strong> to share the full code with you via WhatsApp or SMS. Then follow the steps below to redeem it.</p>
            </div>

            <!-- Steps -->
            <div style="background: #F9F9F9; border-radius: 10px; padding: 22px; margin-top: 20px;">
              <p style="font-size: 16px; font-weight: bold; color: #222; margin: 0 0 18px 0;">📲 How to Redeem — Step by Step:</p>

              <table style="width:100%; border-collapse:collapse;">
                <tr>
                  <td style="width:36px; vertical-align:top; padding:8px 0;">
                    <div style="background:#E53935; color:#fff; border-radius:50%; width:30px; height:30px; text-align:center; line-height:30px; font-weight:bold; font-size:14px;">1</div>
                  </td>
                  <td style="padding:8px 0 8px 12px; font-size:14px; color:#444; vertical-align:top;">
                    Download the <strong>Pune Metro – METRO GEIA App</strong> from Google Play Store or Apple App Store.
                  </td>
                </tr>
                <tr>
                  <td style="width:36px; vertical-align:top; padding:8px 0;">
                    <div style="background:#E53935; color:#fff; border-radius:50%; width:30px; height:30px; text-align:center; line-height:30px; font-weight:bold; font-size:14px;">2</div>
                  </td>
                  <td style="padding:8px 0 8px 12px; font-size:14px; color:#444; vertical-align:top;">
                    Open the app and <strong>Login</strong> with your mobile number (or create a new account).
                  </td>
                </tr>
                <tr>
                  <td style="width:36px; vertical-align:top; padding:8px 0;">
                    <div style="background:#E53935; color:#fff; border-radius:50%; width:30px; height:30px; text-align:center; line-height:30px; font-weight:bold; font-size:14px;">3</div>
                  </td>
                  <td style="padding:8px 0 8px 12px; font-size:14px; color:#444; vertical-align:top;">
                    From the home screen, tap on the <strong>Smart Card</strong> tab in the bottom menu.
                  </td>
                </tr>
                <tr>
                  <td style="width:36px; vertical-align:top; padding:8px 0;">
                    <div style="background:#E53935; color:#fff; border-radius:50%; width:30px; height:30px; text-align:center; line-height:30px; font-weight:bold; font-size:14px;">4</div>
                  </td>
                  <td style="padding:8px 0 8px 12px; font-size:14px; color:#444; vertical-align:top;">
                    On the Smart Card screen, tap on <strong>Gift Cards</strong>.
                  </td>
                </tr>
                <tr>
                  <td style="width:36px; vertical-align:top; padding:8px 0;">
                    <div style="background:#E53935; color:#fff; border-radius:50%; width:30px; height:30px; text-align:center; line-height:30px; font-weight:bold; font-size:14px;">5</div>
                  </td>
                  <td style="padding:8px 0 8px 12px; font-size:14px; color:#444; vertical-align:top;">
                    Tap the green <strong>Redeem</strong> button on the Gift Cards screen.
                  </td>
                </tr>
                <tr>
                  <td style="width:36px; vertical-align:top; padding:8px 0;">
                    <div style="background:#00C9A7; color:#fff; border-radius:50%; width:30px; height:30px; text-align:center; line-height:30px; font-weight:bold; font-size:14px;">6</div>
                  </td>
                  <td style="padding:8px 0 8px 12px; font-size:14px; color:#444; vertical-align:top;">
                    Ask <strong style="color:#E53935;">${giftCard.senderName}</strong> to share the <strong>secret full code</strong> with you via WhatsApp or SMS.<br/>
                    Enter that code in the Redeem field and tap <strong>Redeem Code</strong> — <strong style="color:#00C9A7;">₹${giftCard.amount}</strong> will be added to your Metro Wallet instantly! 🎉
                  </td>
                </tr>
              </table>
            </div>

            <p style="font-size: 12px; color: #bbb; margin-top: 24px; text-align: center;">This gift card is valid for 6 months from the date of issue. For support, contact Pune Metro helpdesk.</p>
          </div>

          <!-- Footer -->
          <div style="background: #E53935; padding: 14px 20px; text-align: center;">
            <p style="margin: 0; color: #fff; font-size: 13px; font-weight: 600;">Pune Metro — METRO GEIA &nbsp;|&nbsp; Pune, Maharashtra, India</p>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error('Failed to send gift card email:', mailErr);
    }

    res.status(200).json({ success: true, message: 'Gift card sent successfully', giftCard, newPin });
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
