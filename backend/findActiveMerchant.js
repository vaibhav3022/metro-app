const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGO_URI);
  console.log('DB Connected');
  
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Merchant = mongoose.model('Merchant', new mongoose.Schema({}, { strict: false }));
  
  const user = await User.findOne({ email: 'merchant1@metro.com' });
  if (!user) {
    console.log('No user merchant1@metro.com found');
    mongoose.disconnect();
    return;
  }
  console.log('Merchant User ID:', user._id);
  
  const merchants = await Merchant.find({ userId: user._id });
  console.log('Merchant Documents associated with merchant1@metro.com user:');
  merchants.forEach(m => {
    console.log({
      id: m._id,
      businessName: m.businessName,
      userId: m.userId,
      qrCodeToken: m.qrCodeToken,
      balance: m.balance,
      status: m.status
    });
  });
  
  mongoose.disconnect();
}

check();
