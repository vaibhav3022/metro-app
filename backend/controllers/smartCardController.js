const SmartCard = require('../models/SmartCard');

// @desc    Link a new Smart Card
// @route   POST /api/smartcard/link
// @access  Private
const linkSmartCard = async (req, res) => {
  try {
    const { cardNumber } = req.body;

    if (!cardNumber || cardNumber.length !== 16) {
      return res.status(400).json({ message: 'Invalid Card Number. Must be 16 digits.' });
    }

    const existingCard = await SmartCard.findOne({ cardNumber });
    if (existingCard) {
      return res.status(400).json({ message: 'This card is already linked to an account.' });
    }

    const smartCard = await SmartCard.create({
      userId: req.user.id,
      cardNumber,
      balance: 150 // Free 150 rs for linking as promotion
    });

    res.status(201).json({ success: true, smartCard });
  } catch (error) {
    console.error('Link Card Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get linked Smart Cards
// @route   GET /api/smartcard
// @access  Private
const getSmartCards = async (req, res) => {
  try {
    const cards = await SmartCard.find({ userId: req.user.id });
    res.status(200).json({ success: true, cards });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Recharge Smart Card
// @route   POST /api/smartcard/recharge
// @access  Private
const rechargeSmartCard = async (req, res) => {
  try {
    const { cardId, amount } = req.body;

    const card = await SmartCard.findOne({ _id: cardId, userId: req.user.id });
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    if (!amount || amount < 50) {
      return res.status(400).json({ message: 'Minimum recharge amount is ₹50' });
    }

    card.balance += Number(amount);
    await card.save();

    res.status(200).json({ success: true, card, message: 'Recharge successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  linkSmartCard,
  getSmartCards,
  rechargeSmartCard
};
