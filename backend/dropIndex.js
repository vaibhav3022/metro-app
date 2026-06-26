const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const GiftCard = require('./models/GiftCard');
    await GiftCard.collection.dropIndex('code_1');
    console.log('Successfully dropped old code_1 index');
  } catch (err) {
    if (err.code === 27) {
      console.log('Index code_1 does not exist, all good.');
    } else {
      console.error('Error dropping index:', err);
    }
  }
  process.exit(0);
});
