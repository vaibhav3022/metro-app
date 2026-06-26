const mongoose = require('mongoose');

const UserMembershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPlan',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  }
}, { timestamps: true });

// Check expiry method
UserMembershipSchema.methods.isExpired = function() {
  return new Date() > this.endDate || this.status === 'expired';
};

module.exports = mongoose.model('UserMembership', UserMembershipSchema);
