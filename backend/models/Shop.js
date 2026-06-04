const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  shopName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Retail', 'Service', 'Other'],
    default: 'Retail'
  },
  description: {
    type: String,
    default: 'A great shop at Pune Metro.'
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80'
  },
  products: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    isAvailable: { type: Boolean, default: true }
  }],
  offers: [{
    title: { type: String, required: true },
    discount: { type: String, required: true },
    validUntil: { type: Date }
  }],
  totalSales: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Shop', ShopSchema);
