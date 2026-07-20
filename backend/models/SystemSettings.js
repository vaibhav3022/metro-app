const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  commissionRate: {
    type: Number,
    required: true,
    default: 2 // 2%
  },
  cashbackRate: {
    type: Number,
    required: true,
    default: 5 // 5%
  },
  ticketValidityMins: {
    type: Number,
    required: true,
    default: 20 // 20 minutes
  },
  journeyValidityMins: {
    type: Number,
    required: true,
    default: 90 // 90 minutes
  }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
