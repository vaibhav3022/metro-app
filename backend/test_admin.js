const mongoose = require('mongoose');
const adminController = require('./controllers/adminController');

mongoose.connect('mongodb://127.0.0.1:27017/punemetro').then(async () => {
  try {
    const req = { user: { _id: 'admin_id' } };
    const res = {
      status: (code) => ({
        json: (data) => { console.log('STATUS:', code, 'DATA:', JSON.stringify(data, null, 2)); }
      })
    };
    await adminController.getDashboardStats(req, res);
    process.exit(0);
  } catch(e) {
    console.error('FAILED:', e);
    process.exit(1);
  }
});
