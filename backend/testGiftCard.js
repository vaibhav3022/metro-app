const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const GiftCard = require('./models/GiftCard');
    const User = require('./models/User');

    const sender = await User.findOne({ email: 'vaibhavdhotre682@gmail.com' });
    if (!sender) throw new Error('Sender not found');

    const amount = 500;
    const finalReceiverEmail = sender.email;
    const giftAmount = parseFloat(amount);
    const senderName = sender.name || 'Metro User';

    function generateRandomString(length) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let result = '';
      for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)];
      return result;
    }

    let cardId = generateRandomString(8);
    const pin = generateRandomString(8);
    const hashedPin = await bcrypt.hash(pin, 10);

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);

    console.log('Trying to create Gift Card...');
    const giftCard = await GiftCard.create({
      cardId,
      hashedPin,
      senderId: sender._id,
      senderName,
      receiverEmail: finalReceiverEmail,
      amount: giftAmount,
      message: '',
      expiresAt
    });

    console.log('Successfully created:', giftCard);
    process.exit(0);
  } catch (err) {
    console.error('ERROR CREATING GIFTCARD:', err);
    process.exit(1);
  }
});
