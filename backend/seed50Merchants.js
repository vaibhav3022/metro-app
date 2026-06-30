const mongoose = require('mongoose');
require('dotenv').config();
const crypto = require('crypto');
const QRCode = require('qrcode');

const User = require('./models/User');
const Merchant = require('./models/Merchant');
const Shop = require('./models/Shop');
const Wallet = require('./models/Wallet');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/punemetro';

async function seedMerchants() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully!');

    const defaultPassword = 'password123';
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 10);

    let createdCount = 0;
    let existingCount = 0;

    for (let i = 1; i <= 50; i++) {
      const email = `merchantuser${i}@metro.com`;
      const name = `Merchant User ${i}`;
      const businessName = `Metro Cafe Counter ${i}`;
      const phone = `77000000${String(i).padStart(2, '0')}`;

      // Check if user already exists
      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name,
          email,
          phone,
          password: defaultPassword,
          role: 'merchant',
          isVerified: true,
          merchantStatus: 'approved',
          otp: '123456',
          otpExpiry: futureDate
        });
        createdCount++;
      } else {
        // Ensure user is updated to merchant role and status if they already exist
        user.role = 'merchant';
        user.merchantStatus = 'approved';
        user.isVerified = true;
        await user.save();
        existingCount++;
      }

      // Check or create Wallet
      let wallet = await Wallet.findOne({ userId: user._id });
      if (!wallet) {
        await Wallet.create({
          userId: user._id,
          balance: 500, // starting dev balance
          transactions: []
        });
      }

      // Check or create Merchant
      let merchant = await Merchant.findOne({ userId: user._id });
      if (!merchant) {
        const qrCodeToken = crypto.randomBytes(16).toString('hex');
        
        merchant = new Merchant({
          userId: user._id,
          businessName,
          businessType: i % 2 === 0 ? 'Food' : 'Retail',
          address: `Pune Metro Station Counter ${i}`,
          phone: user.phone,
          status: 'approved',
          approvedAt: new Date(),
          qrCodeToken
        });

        const qrData = JSON.stringify({
          type: 'merchant_payment',
          mId: merchant._id.toString(),
          token: qrCodeToken
        });

        merchant.qrCodeImageUrl = await QRCode.toDataURL(qrData);
        await merchant.save();
      } else {
        // Ensure approved status
        merchant.status = 'approved';
        if (!merchant.qrCodeToken) {
          merchant.qrCodeToken = crypto.randomBytes(16).toString('hex');
          const qrData = JSON.stringify({
            type: 'merchant_payment',
            mId: merchant._id.toString(),
            token: merchant.qrCodeToken
          });
          merchant.qrCodeImageUrl = await QRCode.toDataURL(qrData);
        }
        await merchant.save();
      }

      // Check or create Shop
      let shop = await Shop.findOne({ merchantId: merchant._id });
      if (!shop) {
        await Shop.create({
          merchantId: merchant._id,
          shopName: businessName,
          category: merchant.businessType,
          description: `Pune Metro Counter ${i} offering quick snacks, tea, coffee, and daily essentials.`,
          products: [
            { name: 'Tea', price: 15, isAvailable: true },
            { name: 'Coffee', price: 25, isAvailable: true },
            { name: 'Samosa', price: 20, isAvailable: true },
            { name: 'Water Bottle', price: 20, isAvailable: true }
          ]
        });
      }
    }

    console.log('Seeding process completed!');
    console.log(`- Created new merchants: ${createdCount}`);
    console.log(`- Updated existing: ${existingCount}`);
    console.log('---------------------------------------------');
    console.log('Merchant Credentials:');
    console.log('Emails: merchantuser1@metro.com to merchantuser50@metro.com');
    console.log('Password: password123');
    console.log('---------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding merchants:', error);
    process.exit(1);
  }
}

seedMerchants();
