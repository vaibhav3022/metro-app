const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    // Connect to the DB
    await mongoose.connect('mongodb://127.0.0.1:27017/punemetro', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB Connected.');

    const adminEmail = 'admin@punemetro.com';
    const adminPassword = 'PuneMetro@2026';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin already exists. Updating password to be safe.');
      existingAdmin.password = adminPassword; // pre-save hook will hash it
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('Admin updated.');
    } else {
      const admin = new User({
        name: 'System Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created successfully.');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
