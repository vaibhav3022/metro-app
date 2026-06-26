const mongoose = require('mongoose');

const WalletTransactionSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  userId: { // Keep userId for easier queries across user's wallet
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  referenceType: {
    type: String, // e.g., 'GIFT_CARD_REDEEM', 'QR_PAYMENT', 'TICKET_BOOKING', 'WALLET_TOPUP'
    default: 'GENERAL'
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId, // Link to GiftCard, ShopTransaction, Ticket, etc.
    default: null
  }
}, { timestamps: true });

// Index for faster queries
WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
