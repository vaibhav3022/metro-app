const mongoose = require('mongoose');

const MerchantTransactionSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS'
  },
  type: {
    type: String,
    enum: ['qr_payment', 'withdrawal', 'refund'],
    default: 'qr_payment'
  }
}, { timestamps: true });

module.exports = mongoose.model('MerchantTransaction', MerchantTransactionSchema);
