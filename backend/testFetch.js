const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const GiftCard = require('./models/GiftCard');
    const User = require('./models/User');

    const sender = await User.findOne({ email: 'vaibhavdhotre682@gmail.com' });
    if (!sender) throw new Error('Sender not found');

    const giftCards = await GiftCard.find({ senderId: sender._id }).sort({ createdAt: -1 });
    
    // Simulate what the frontend does
    const inventory = giftCards.filter(g => !g.receiverEmail);
    const sent = giftCards.filter(g => g.receiverEmail);
    
    console.log(`Total: ${giftCards.length}, Inventory: ${inventory.length}, Sent: ${sent.length}`);
    
    // Print the most recent 3 from inventory
    console.log('Most recent in inventory:', inventory.slice(0, 3).map(g => ({
      id: g.cardId,
      code: g.code,
      receiverEmail: g.receiverEmail
    })));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
});
