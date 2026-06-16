const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Ticket = require('./models/Ticket');
const Shop = require('./models/Shop');
const ShopTransaction = require('./models/ShopTransaction');
const Station = require('./models/Station');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/punemetro';

(async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const counts = {
      users: await User.countDocuments(),
      tickets: await Ticket.countDocuments(),
      shops: await Shop.countDocuments(),
      shopTransactions: await ShopTransaction.countDocuments(),
      stations: await Station.countDocuments()
    };
    console.log('Collection counts:', counts);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error counting documents:', err);
    process.exit(1);
  }
})();
