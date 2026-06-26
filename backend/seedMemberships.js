const mongoose = require('mongoose');
require('dotenv').config();
const MembershipPlan = require('./models/MembershipPlan');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/punemetro', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const plans = [
  {
    name: 'BASIC',
    price: 199,
    durationDays: 30,
    features: ['Send Gift Cards', 'Access to Member Lounge', 'Priority Support']
  },
  {
    name: 'PREMIUM',
    price: 999,
    durationDays: 180,
    features: ['Send Gift Cards', 'Access to Member Lounge', 'Priority Support', 'Zero Convenience Fee', 'Free Metro Wifi']
  }
];

const seedPlans = async () => {
  try {
    await MembershipPlan.deleteMany();
    await MembershipPlan.insertMany(plans);
    console.log('Membership plans seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding plans:', error);
    process.exit(1);
  }
};

seedPlans();
