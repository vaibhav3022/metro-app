const mongoose = require('mongoose');

const RevenueSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  totalTicketSales: {
    type: Number,
    default: 0
  },
  totalTokenSales: {
    type: Number,
    default: 0
  },
  totalWalletTopups: {
    type: Number,
    default: 0
  },
  platformCommission: {
    type: Number,
    default: 0
  },
  merchantPayouts: {
    type: Number,
    default: 0
  },
  netRevenue: {
    type: Number,
    default: 0
  },
  activeUsers: {
    type: Number,
    default: 0
  },
  newMerchants: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Revenue', RevenueSchema);
