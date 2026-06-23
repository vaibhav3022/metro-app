require('dotenv').config();
const mongoose = require('mongoose');
const Shop = require('./models/Shop');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Metro Cafe 1 -> Oasis T Cafe
  const update1 = await Shop.updateOne(
    { shopName: /Metro Cafe\s*1/i },
    { 
      $set: { 
        shopName: 'Oasis T Cafe',
        description: 'A premium cafe offering the best tea, coffee, and snacks at the Metro Station.',
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80',
        category: 'Food',
        products: [
          { name: 'Special Masala Tea', price: 30, description: 'Authentic Indian Masala Chai', isAvailable: true },
          { name: 'Cold Coffee', price: 80, description: 'Chilled and refreshing coffee', isAvailable: true },
          { name: 'Veg Sandwich', price: 60, description: 'Fresh veggies and cheese', isAvailable: true }
        ]
      } 
    }
  );
  console.log('Updated Oasis T Cafe:', update1.modifiedCount);

  // Metro Cafe 2 -> LL Beauty
  const update2 = await Shop.updateOne(
    { shopName: /Metro Cafe\s*2/i },
    { 
      $set: { 
        shopName: 'LL Beauty',
        category: 'Retail',
        description: 'Your one-stop shop for premium cosmetics, skincare, and beauty products.',
        imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80',
        products: [
          { name: 'Matte Lipstick', price: 299, description: 'Long-lasting matte finish', isAvailable: true },
          { name: 'Face Serum', price: 499, description: 'Vitamin C glowing serum', isAvailable: true },
          { name: 'Nail Polish Set', price: 199, description: 'Pack of 3 vibrant colors', isAvailable: true }
        ]
      } 
    }
  );
  console.log('Updated LL Beauty:', update2.modifiedCount);

  console.log('Shops updated successfully');
  process.exit(0);
}

run().catch(console.error);
