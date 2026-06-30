const mongoose = require('mongoose');
require('dotenv').config();
const QRCode = require('qrcode');
const crypto = require('crypto');

const Shop = require('../models/Shop');
const Merchant = require('../models/Merchant');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/punemetro';

async function syncMerchantNames() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    const shops = await Shop.find({});
    console.log(`Found ${shops.length} shops in database.`);

    for (const shop of shops) {
      const merchant = await Merchant.findById(shop.merchantId);
      if (!merchant) {
        console.log(`No merchant found for shop: ${shop.shopName} (MerchantID: ${shop.merchantId})`);
        continue;
      }

      const oldName = merchant.businessName;
      const newName = shop.shopName;

      // Update merchant businessName
      merchant.businessName = newName;

      // Ensure qrCodeToken exists
      if (!merchant.qrCodeToken) {
        merchant.qrCodeToken = crypto.randomBytes(16).toString('hex');
      }

      // Generate new QR code including businessName
      const qrData = JSON.stringify({
        type: 'merchant_payment',
        mId: merchant._id.toString(),
        token: merchant.qrCodeToken,
        businessName: newName,
        merchantName: newName,
        shopName: newName
      });

      merchant.qrCodeImageUrl = await QRCode.toDataURL(qrData);
      await merchant.save();

      console.log(`Synced: "${oldName}" -> "${newName}" (Merchant ID: ${merchant._id})`);
    }

    console.log('Merchant names synchronization completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error during synchronization:', error);
    process.exit(1);
  }
}

syncMerchantNames();
