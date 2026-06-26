const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  await User.updateMany(
    { email: { $in: ['vaibhavdhotre682@gmail.com', 'dhotrev384@gmail.com', 'testpassenger@metro.com'] } },
    { $set: { role: 'member' } }
  );
  console.log('Forced member role on test users.');
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
