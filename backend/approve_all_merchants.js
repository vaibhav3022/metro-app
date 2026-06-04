const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/punemetro').then(async () => {
  try {
    const Merchant = require('./models/Merchant');
    
    const result = await Merchant.updateMany(
      { status: { $ne: 'approved' } },
      { $set: { status: 'approved', approvedAt: new Date() } }
    );
    
    console.log(`Approved ${result.modifiedCount} merchants.`);
    process.exit(0);
  } catch (e) {
    console.error('Error approving merchants:', e);
    process.exit(1);
  }
});
