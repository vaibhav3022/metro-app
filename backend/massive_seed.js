const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Merchant = require('./models/Merchant');
const Shop = require('./models/Shop');
const Station = require('./models/Station');
const Ticket = require('./models/Ticket');
const TokenTransaction = require('./models/TokenTransaction');
const Revenue = require('./models/Revenue');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/punemetro';

async function seedMassive() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB for MASSIVE seeding...');
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped.');

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 10);
    const defaultPassword = 'password123';

    // 1. ADMIN
    const adminUser = await User.create({
      name: 'Super Admin', email: 'admin@metro.com', phone: '9999999999', password: defaultPassword, role: 'admin', isVerified: true, otp: '123456', otpExpiry: futureDate
    });

    // 2. STATIONS
    const stationNames = ['PCMC', 'Sant Tukaram Nagar', 'Bhosari', 'Kasarwadi', 'Phugewadi', 'Dapodi', 'Bopodi', 'Khadki', 'Range Hill', 'Shivaji Nagar', 'Civil Court', 'PMC', 'Deccan Gymkhana', 'Garware College', 'Nal Stop', 'Ideal Colony', 'Anand Nagar', 'Vanaz'];
    const stations = [];
    for (let i = 0; i < stationNames.length; i++) {
      stations.push(await Station.create({
        name: stationNames[i], code: stationNames[i].substring(0, 3).toUpperCase(), metroLine: i < 10 ? 'Line 1' : 'Line 2', latitude: 18.5204 + (i * 0.01), longitude: 73.8567 + (i * 0.01), isActive: true
      }));
    }

    // 3. MASSIVE USERS (150 Users)
    console.log('Creating 150 Users...');
    const users = [];
    for (let i = 1; i <= 150; i++) {
      users.push(await User.create({
        name: `Traveler ${i}`, email: `user${i}@metro.com`, phone: `888888${String(i).padStart(4, '0')}`, password: defaultPassword, role: 'user', isVerified: true,
        walletBalance: Math.floor(Math.random() * 5000) + 100, tokenBalance: Math.floor(Math.random() * 500), otp: '123456', otpExpiry: futureDate, createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000)
      }));
    }

    // 4. MASSIVE MERCHANTS (40 Merchants)
    console.log('Creating 40 Merchants...');
    const merchants = [];
    for (let i = 1; i <= 40; i++) {
      const status = i <= 25 ? 'approved' : i <= 32 ? 'pending' : 'suspended';
      const mUser = await User.create({
        name: `Merchant Owner ${i}`, email: `merchant${i}@metro.com`, phone: `777777${String(i).padStart(4, '0')}`, password: defaultPassword, role: 'merchant', isVerified: true, merchantStatus: status, otp: '123456', otpExpiry: futureDate, createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000)
      });
      const merchant = await Merchant.create({
        userId: mUser._id, businessName: `Metro Cafe ${i}`, address: `Station Area ${i % stationNames.length}, Pune`, phone: mUser.phone, status: status,
        totalEarnings: Math.floor(Math.random() * 50000), totalOrders: Math.floor(Math.random() * 500), createdAt: mUser.createdAt
      });
      merchants.push(merchant);
      await Shop.create({ merchantId: merchant._id, shopName: `Metro Cafe ${i}`, category: i % 3 === 0 ? 'Food' : 'Retail', products: [{ name: 'Coffee', price: 40, isAvailable: true }, { name: 'Snack', price: 60, isAvailable: true }] });
    }

    // 5. MASSIVE TICKETS (500 Tickets)
    console.log('Creating 500 Tickets...');
    let totalTicketRev = 0;
    for (let i = 0; i < 500; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const src = stations[Math.floor(Math.random() * stations.length)].name;
      const dest = stations[Math.floor(Math.random() * stations.length)].name;
      const fare = Math.floor(Math.random() * 40) + 10;
      totalTicketRev += fare;
      const pastDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000); // last 30 days
      await Ticket.create({
        userId: randomUser._id, sourceStation: src, destinationStation: dest, source: src, destination: dest, fare: fare, totalAmount: fare, passengers: 1, paymentStatus: 'success', status: Math.random() > 0.5 ? 'used' : 'active', bookingTime: pastDate, createdAt: pastDate
      });
    }

    // 6. MASSIVE TOKEN TRANSACTIONS (600 Transactions)
    console.log('Creating 600 Token Transactions...');
    let totalTokenRev = 0;
    for (let i = 0; i < 600; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const type = Math.random() > 0.6 ? 'purchase' : 'redemption';
      const amount = Math.floor(Math.random() * 100) + 10;
      const pastDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000);
      
      const payload = { userId: randomUser._id, type, amount, balanceAfter: 100, status: 'success', createdAt: pastDate };
      if (type === 'purchase') { totalTokenRev += amount; }
      else { payload.merchantId = merchants[Math.floor(Math.random() * merchants.length)]._id; }
      
      await TokenTransaction.create(payload);
    }

    // 7. DAILY REVENUE LOGS (Last 30 Days)
    console.log('Generating 30 Days of Revenue Data...');
    for (let i = 30; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dayTickets = Math.floor(Math.random() * 10000) + 5000;
      const dayTokens = Math.floor(Math.random() * 5000) + 1000;
      await Revenue.create({
        date: date, totalRevenue: dayTickets + dayTokens, platformCommission: (dayTickets + dayTokens) * 0.1, tokenSalesRevenue: dayTokens, merchantPayouts: dayTokens * 0.8, createdAt: date
      });
    }

    console.log('MASSIVE SEEDING SUCCESSFUL!');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
seedMassive();
