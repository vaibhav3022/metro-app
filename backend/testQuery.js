const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const GiftCard = require('./models/GiftCard');
    const cards = await GiftCard.find({});
    console.log('Total Cards:', cards.length);
    console.log(cards.map(c => ({ id: c.cardId, sender: c.senderId, receiverEmail: c.receiverEmail })));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
});
