const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/punemetro', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      console.log("Connected to MongoDB.");
      let user = new User({ email: 'testotp@test.com' });
      user.otp = '123456';
      user.otpExpiry = new Date();
      await user.save();
      console.log("User saved successfully!");
    } catch (e) {
      console.error("Error saving user:", e);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => console.error("MongoDB connection error:", err));
