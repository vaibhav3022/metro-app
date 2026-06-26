const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const GiftCard = require('./models/GiftCard');
    const User = require('./models/User');

    const card = await GiftCard.findOne({ receiverEmail: { $exists: false } }).sort({ createdAt: -1 });
    console.log('Unsent Card:', card);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
});
