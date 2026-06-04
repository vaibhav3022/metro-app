require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Shop = require('./models/Shop');
const Wallet = require('./models/Wallet');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/punemetro');
    console.log('Connected to DB');

    // 1. Create Admin
    let admin = await User.findOne({ email: 'admin@punemetro.com' });
    if (!admin) {
      admin = new User({ email: 'admin@punemetro.com', name: 'Metro Admin', role: 'admin' });
      await admin.save();
      console.log('Admin user created: admin@punemetro.com');
    } else {
      admin.role = 'admin';
      await admin.save();
      console.log('Admin user already exists. Role set to admin.');
    }

    // 2. Create Merchant
    let merchant = await User.findOne({ email: 'merchant@punemetro.com' });
    if (!merchant) {
      merchant = new User({ email: 'merchant@punemetro.com', name: 'Metro Snacks & Tea', role: 'merchant' });
      await merchant.save();
      console.log('Merchant user created: merchant@punemetro.com');
    } else {
      merchant.role = 'merchant';
      await merchant.save();
      console.log('Merchant user already exists. Role set to merchant.');
    }

    // 3. Create a shop for the merchant
    let shop = await Shop.findOne({ merchantId: merchant._id });
    if (!shop) {
      shop = new Shop({
        merchantId: merchant._id,
        shopName: 'Metro Snacks & Tea',
        category: 'Food & Beverage',
        description: 'Hot tea, coffee, and snacks right at the station.',
        isActive: true
      });
      await shop.save();
      console.log('Shop created for merchant.');
    }

    // 4. Create wallet for merchant
    let merchantWallet = await Wallet.findOne({ userId: merchant._id });
    if (!merchantWallet) {
        merchantWallet = new Wallet({ userId: merchant._id, balance: 0, transactions: [] });
        await merchantWallet.save();
        console.log('Wallet created for merchant.');
    }

    console.log('\n--- SEEDING COMPLETE ---');
    console.log('Admin Login: admin@punemetro.com');
    console.log('Merchant Login: merchant@punemetro.com');
    console.log('Note: Enter the email in the App and check the Backend Terminal to see the 6-digit OTP for login.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
