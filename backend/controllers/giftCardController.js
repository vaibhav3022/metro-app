const GiftCard = require('../models/GiftCard');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'dhotrev384@gmail.com', pass: 'uqvjsavnkzrxreen' }
});

// Generate a 12-char alphanumeric gift code formatted as XXXX-XXXX-XXXX
function generateGiftCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code.match(/.{1,4}/g).join('-'); // Format: XXXX-XXXX-XXXX
}

// @desc    Create a new gift card (deducts amount from sender's wallet)
// @route   POST /api/giftcard/create
// @access  Private
const createGiftCard = async (req, res) => {
  try {
    const { amount, receiverEmail, message } = req.body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'A valid gift card amount is required.' });
    }

    if (!receiverEmail) {
      return res.status(400).json({ message: 'Receiver email is required.' });
    }

    const giftAmount = parseFloat(amount);

    // Deduct from sender's wallet
    const senderWallet = await Wallet.findOne({ userId: req.user.id });
    if (!senderWallet || senderWallet.balance < giftAmount) {
      return res.status(400).json({ message: 'Insufficient wallet balance.' });
    }

    senderWallet.balance -= giftAmount;
    senderWallet.transactions.push({
      type: 'debit',
      amount: giftAmount,
      description: `Gift Card sent to ${receiverEmail}`,
      date: new Date()
    });
    await senderWallet.save();

    // Get sender name
    const sender = await User.findById(req.user.id);
    const senderName = sender ? sender.name : 'Metro User';

    // Generate unique code
    let code = generateGiftCode();
    while (await GiftCard.findOne({ code })) {
      code = generateGiftCode();
    }

    // Set expiry to 6 months from now
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);

    const giftCard = await GiftCard.create({
      code,
      senderId: req.user.id,
      senderName,
      receiverEmail,
      amount: giftAmount,
      message: message || '',
      expiresAt
    });

    // Send Email to receiver
    const mailOptions = {
      from: '"Pune Metro" <dhotrev384@gmail.com>',
      to: receiverEmail,
      subject: `🎁 You received a ₹${giftAmount} Pune Metro Gift Card!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #FF6B6B, #EE5A24); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Pune Metro Gift Card</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">You have received a special gift!</p>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <p style="font-size: 18px; color: #333;">Hi there,</p>
            <p style="font-size: 16px; color: #555;"><strong>${senderName}</strong> has sent you a Pune Metro Digital Gift Card worth <strong>₹${giftAmount}</strong>.</p>
            ${message ? `<p style="font-size: 16px; color: #555; font-style: italic; background: #fff; padding: 15px; border-left: 4px solid #EE5A24;">"${message}"</p>` : ''}
            <div style="margin: 30px 0; text-align: center;">
              <p style="font-size: 14px; color: #888; margin-bottom: 5px;">Your Gift Card Code</p>
              <div style="background-color: #fff; border: 2px dashed #00C9A7; display: inline-block; padding: 15px 25px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #333;">
                ${code}
              </div>
            </div>
            <p style="font-size: 14px; color: #666; text-align: center;">To use this gift card, open the Pune Metro app, go to Smart Card > Gift Cards, and click Redeem.</p>
          </div>
          <div style="background-color: #333; padding: 15px; text-align: center; color: #aaa; font-size: 12px;">
            This is an automated email. Please do not reply.<br>
            Pune Metro App &copy; ${new Date().getFullYear()}
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error('Failed to send gift card email:', mailErr);
      // We don't fail the request if email fails, but log it
    }

    res.status(201).json({
      success: true,
      message: 'Gift card created successfully.',
      giftCard
    });
  } catch (error) {
    console.error('Create Gift Card Error:', error);
    res.status(500).json({ message: 'Server error creating gift card.' });
  }
};

// @desc    Redeem a gift card by code (adds amount to receiver's wallet)
// @route   POST /api/giftcard/redeem
// @access  Private
const redeemGiftCard = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Gift card code is required.' });
    }

    const giftCard = await GiftCard.findOne({ code });

    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found.' });
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
        { receiverEmail: email, receiverEmail: { $ne: '' } },
        { receiverId: req.user.id }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, giftCards });
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
    const giftCard = await GiftCard.findOne({ code: req.params.code });

    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found.' });
    }

    // Check if expired
    if (giftCard.status === 'active' && new Date() > giftCard.expiresAt) {
      giftCard.status = 'expired';
      await giftCard.save();
    }

    res.status(200).json({
      success: true,
      giftCard: {
        code: giftCard.code,
        senderName: giftCard.senderName,
        amount: giftCard.amount,
        message: giftCard.message,
        status: giftCard.status,
        expiresAt: giftCard.expiresAt,
        createdAt: giftCard.createdAt
      }
    });
  } catch (error) {
    console.error('Get Gift Card By Code Error:', error);
    res.status(500).json({ message: 'Server error retrieving gift card.' });
  }
};

module.exports = {
  createGiftCard,
  redeemGiftCard,
  getMyGiftCards,
  getReceivedGiftCards,
  getGiftCardByCode
};
