const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Merchant = require('./models/Merchant');
const Shop = require('./models/Shop');
const ShopTransaction = require('./models/ShopTransaction');
const Station = require('./models/Station');
const Ticket = require('./models/Ticket');
const TokenTransaction = require('./models/TokenTransaction');
const Revenue = require('./models/Revenue');
const AuditLog = require('./models/AuditLog');
const Notification = require('./models/Notification');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/punemetro';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB for seeding...');

    // Clear all collections individually (Atlas doesn't allow dropDatabase)
    await User.deleteMany({});
    await Merchant.deleteMany({});
    await Shop.deleteMany({});
    await ShopTransaction.deleteMany({});
    await Station.deleteMany({});
    await Ticket.deleteMany({});
    await TokenTransaction.deleteMany({});
    await Revenue.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared all collections.');

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 10);
    
    const defaultPassword = 'password123';

    // Create Admin
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@metro.com',
      phone: '9999999999',
      password: defaultPassword,
      role: 'admin',
      isVerified: true,
      otp: '123456',
      otpExpiry: futureDate
    });

    // Create 10 Users
    const users = [];
    for (let i = 1; i <= 10; i++) {
      users.push(await User.create({
        name: `Traveler ${i}`,
        email: `user${i}@metro.com`,
        phone: `888888888${i - 1}`,
        password: defaultPassword,
        role: 'user',
        isVerified: true,
        walletBalance: Math.floor(Math.random() * 500) + 100,
        tokenBalance: Math.floor(Math.random() * 100),
        otp: '123456',
        otpExpiry: futureDate
      }));
    }

    // Create 10 Merchants
    const merchants = [];
    const createdShops = [];
    for (let i = 1; i <= 10; i++) {
      const status = i <= 6 ? 'approved' : i <= 8 ? 'pending' : 'suspended';
      const mUser = await User.create({
        name: `Merchant Owner ${i}`,
        email: `merchant${i}@metro.com`,
        phone: `777777777${i - 1}`,
        password: defaultPassword,
        role: 'merchant',
        isVerified: true,
        merchantStatus: status,
        otp: '123456',
        otpExpiry: futureDate
      });

      const merchant = await Merchant.create({
        userId: mUser._id,
        businessName: `Metro Cafe ${i}`,
        address: `Station Area ${i}, Pune`,
        phone: mUser.phone,
        status: status,
        totalEarnings: Math.floor(Math.random() * 5000),
        totalOrders: Math.floor(Math.random() * 50)
      });
      merchants.push(merchant);

      const shop = await Shop.create({
        merchantId: merchant._id,
        shopName: `Metro Cafe ${i}`,
        category: i % 2 === 0 ? 'Food' : 'Retail',
        products: [
          { name: `Coffee ${i}`, price: 40, isAvailable: true },
          { name: `Sandwich ${i}`, price: 60, isAvailable: true }
        ],
        offers: [
          { title: '10% Off', discount: '10%', validUntil: futureDate }
        ]
      });
      createdShops.push(shop);
    }

    // Create 10 Stations
    const stationNames = ['PCMC', 'Sant Tukaram Nagar', 'Bhosari', 'Kasarwadi', 'Phugewadi', 'Dapodi', 'Bopodi', 'Khadki', 'Range Hill', 'Shivaji Nagar'];
    const stations = [];
    for (let i = 0; i < 10; i++) {
      stations.push(await Station.create({
        name: stationNames[i],
        code: stationNames[i].substring(0, 3).toUpperCase(),
        metroLine: 'Line 1',
        latitude: 18.5204 + (i * 0.01),
        longitude: 73.8567 + (i * 0.01),
        isActive: true
      }));
    }

    // Create Tickets
    for (let i = 0; i < 10; i++) {
      await Ticket.create({
        userId: users[i]._id,
        sourceStation: stations[0].name,
        destinationStation: stations[5].name,
        fare: 25,
        bookingTime: new Date(),
        qrCode: `QR_${Math.random()}`,
        status: 'active'
      });
    }

    // Create Token Transactions
    for (let i = 0; i < 10; i++) {
      await TokenTransaction.create({
        userId: users[i]._id,
        type: 'purchase',
        amount: 100,
        balanceAfter: 100
      });
      await TokenTransaction.create({
        userId: users[i]._id,
        merchantId: merchants[0]._id,
        type: 'redemption',
        amount: 25,
        balanceAfter: 75
      });
    }

    // Create Revenue
    await Revenue.create({
      date: new Date(),
      netRevenue: 50000,
      platformCommission: 5000,
      totalTokenSales: 20000,
      totalTicketSales: 30000,
      merchantPayouts: 15000
    });

    // Create Notifications
    await Notification.create({
      recipientId: adminUser._id,
      recipientRole: 'admin',
      title: 'System Initialized',
      message: 'Dummy data successfully populated.',
      type: 'info'
    });
    for (let i = 0; i < 3; i++) {
      await Notification.create({
        recipientId: users[0]._id,
        recipientRole: 'user',
        title: 'Welcome!',
        message: `Welcome to Pune Metro App user ${i}`,
        type: 'info'
      });
    }

    // Create Shop Transactions
    for (let i = 0; i < 10; i++) {
      await ShopTransaction.create({
        shopId: createdShops[i]._id,
        userId: users[i]._id,
        amount: Math.floor(Math.random() * 200) + 50,
        paymentId: `MOCK-SHOP-PAY-${Date.now()}-${i}`,
        paymentMethod: i % 2 === 0 ? 'wallet' : 'razorpay',
        status: 'SUCCESS',
        timestamp: new Date()
      });
    }

    console.log('Seeding successful!');
    console.log('=============================');
    console.log('ADMIN LOGIN: email: admin@metro.com, OTP: 123456');
    console.log('USER LOGIN: email: user1@metro.com, OTP: 123456');
    console.log('MERCHANT LOGIN: email: merchant1@metro.com, OTP: 123456');
    console.log('=============================');

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
