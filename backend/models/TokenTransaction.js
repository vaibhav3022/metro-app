const mongoose = require('mongoose');

const TokenTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant'
  },
  type: {
    type: String,
    enum: ['purchase', 'redemption', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  baseAmount: {
    type: Number
  },
  gstAmount: {
    type: Number
  },
  totalAmountPaid: {
    type: Number
  },
  balanceBefore: {
    type: Number
  },
  balanceAfter: {
    type: Number
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'success'
  }
}, { timestamps: true });

module.exports = mongoose.model('TokenTransaction', TokenTransactionSchema);
