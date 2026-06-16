const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticketId: { type: String },
  source: { type: String },
  destination: { type: String },
  sourceStation: { type: String },
  destinationStation: { type: String },
  distance: { type: Number },
  fare: { type: Number, required: true },
  passengers: { type: Number, default: 1 },
  totalAmount: { type: Number },
  isReturn: { type: Boolean, default: false },
  paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  ticketStatus: { type: String, enum: ['active', 'entered', 'used', 'expired', 'valid'], default: 'active' },
  status: { type: String, enum: ['active', 'entered', 'used', 'expired', 'valid'], default: 'active' },
  travelDate: { type: Date },
  qrData: { type: String },
  qrCode: { type: String },
  paymentId: { type: String },
  bookingTime: {
    type: Date,
    default: Date.now
  },
  entryTime: { type: Date },
  exitTime: { type: Date },
  usedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);
