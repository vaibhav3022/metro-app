const mongoose = require('mongoose');

const MerchantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    trim: true,
    default: 'Retail'
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'rejected'],
    default: 'pending'
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalTokensAccepted: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  approvedAt: {
    type: Date
  },
  suspendedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Merchant', MerchantSchema);
