const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const GiftCard = require('./models/GiftCard');
    const User = require('./models/User');

    const sender = await User.findOne({ email: 'vaibhavdhotre682@gmail.com' });
    if (!sender) throw new Error('Sender not found');

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

    console.log('Creating Gift Card...');
    const giftCard = await GiftCard.create({
      cardId,
      hashedPin,
      senderId: sender._id,
      senderName: sender.name,
      amount: 500,
      expiresAt
    });
    console.log('Created!', giftCard.cardId);

    console.log('Attempting to send...');
    giftCard.receiverEmail = 'testuser2@example.com';
    giftCard.message = 'Hello there!';
    
    await giftCard.save();
    console.log('Successfully saved gift card during send!');
    
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
});
