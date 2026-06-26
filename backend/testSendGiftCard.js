const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const GiftCard = require('./models/GiftCard');
    const User = require('./models/User');

    const sender = await User.findOne({ email: 'vaibhavdhotre682@gmail.com' });
    if (!sender) throw new Error('Sender not found');

    const giftCard = await GiftCard.findOne({ senderId: sender._id, status: 'active' });
    if (!giftCard) throw new Error('No active gift card found to send');

    console.log('Found Gift Card:', giftCard.cardId);

    giftCard.receiverEmail = 'friend@example.com';
    giftCard.message = 'Test message';
    
    await giftCard.save();
    console.log('Successfully saved gift card');
  } catch (err) {
    console.error('ERROR SENDING GIFTCARD:', err);
  }
  process.exit(0);
});
