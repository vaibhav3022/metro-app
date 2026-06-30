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
  
  // Metro Cafe 3 -> Appa Filter Coffee
  const update3 = await Shop.updateOne(
    { shopName: /Metro Cafe\s*3/i },
    { 
      $set: { 
        shopName: 'Appa Filter Coffee',
        category: 'Food',
        description: 'Authentic South Indian filter coffee and traditional snacks.',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80',
        products: [
          { name: 'Special Filter Coffee', price: 40, description: 'Traditional South Indian Filter Coffee', isAvailable: true },
          { name: 'Idli (2 Pcs)', price: 50, description: 'Soft steamed rice cakes', isAvailable: true },
          { name: 'Medu Vada (2 Pcs)', price: 60, description: 'Crispy lentil donuts', isAvailable: true }
        ]
      } 
    }
  );
  console.log('Updated Appa Filter Coffee:', update3.modifiedCount);

  // Metro Cafe 4 -> Percolate Cafe
  const update4 = await Shop.updateOne(
    { shopName: /Metro Cafe\s*4/i },
    { 
      $set: { 
        shopName: 'Percolate Cafe',
        category: 'Food',
        description: 'Artisanal specialty coffee, cold brews, and fresh pastries.',
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80',
        products: [
          { name: 'Cappuccino', price: 120, description: 'Rich espresso with steamed milk foam', isAvailable: true },
          { name: 'Cold Brew', price: 140, description: 'Slow-steeped cold coffee', isAvailable: true },
          { name: 'Chocolate Croissant', price: 90, description: 'Flaky pastry filled with chocolate', isAvailable: true }
        ]
      } 
    }
  );
  console.log('Updated Percolate Cafe:', update4.modifiedCount);

  // Metro Cafe 5 -> Jumbo Burger
  const update5 = await Shop.updateOne(
    { shopName: /Metro Cafe\s*5/i },
    { 
      $set: { 
        shopName: 'Jumbo Burger',
        category: 'Food',
        description: 'Giant, delicious, flame-grilled burgers served with crispy fries.',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
        products: [
          { name: 'Classic Veg Burger', price: 80, description: 'Crispy veg patty with mayo and lettuce', isAvailable: true },
          { name: 'Double Cheese Burger', price: 150, description: 'Two patties with double cheddar cheese', isAvailable: true },
          { name: 'French Fries', price: 60, description: 'Salted golden potato fries', isAvailable: true }
        ]
      } 
    }
  );
  console.log('Updated Jumbo Burger:', update5.modifiedCount);

  // Metro Cafe 6 -> Eva
  const update6 = await Shop.updateOne(
    { shopName: /Metro Cafe\s*6/i },
    { 
      $set: { 
        shopName: 'Eva',
        category: 'Retail',
        description: 'Premium beauty salon products, cosmetics, and organic perfumes.',
        imageUrl: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&q=80',
        products: [
          { name: 'Luxury Hair Spa Kit', price: 799, description: 'Complete hair nourishing spa system', isAvailable: true },
          { name: 'Organic Body Lotion', price: 349, description: 'Natural moisturizing body lotion', isAvailable: true },
          { name: 'Premium Fragrance', price: 999, description: 'Exclusive signature organic perfume', isAvailable: true }
        ]
      } 
    }
  );
  console.log('Updated Eva:', update6.modifiedCount);

  // Metro Cafe 7 -> CoWorking Space
  const update7 = await Shop.updateOne(
    { shopName: /Metro Cafe\s*7/i },
    { 
      $set: { 
        shopName: 'CoWorking Space',
        category: 'Services',
        description: 'Fully equipped modern work pods, high-speed Wi-Fi, and meeting rooms.',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&q=80',
        products: [
          { name: 'Hourly Pass', price: 100, description: 'Access to work pods for 1 hour', isAvailable: true },
          { name: 'Daily Hot Desk Pass', price: 500, description: 'Full day access to hot desking space', isAvailable: true },
          { name: 'Meeting Room (Per Hour)', price: 800, description: 'Private meeting room for up to 6 people', isAvailable: true }
        ]
      } 
    }
  );
  console.log('Updated CoWorking Space:', update7.modifiedCount);

  // Metro Cafe 8 -> Energia
  const update8 = await Shop.updateOne(
    { shopName: /Metro Cafe\s*8/i },
    { 
      $set: { 
        shopName: 'Energia',
        category: 'Services',
        description: 'Convenient electric vehicle charging services and accessories.',
        imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&q=80',
        products: [
          { name: 'Rapid EV Charge (per kWh)', price: 15, description: 'Fast DC charging session', isAvailable: true },
          { name: 'Standard Auto Charge', price: 100, description: 'Slow charging for 2/3 wheelers', isAvailable: true },
          { name: 'EV Adapter Lease', price: 50, description: 'Temporary lease for charging adapters', isAvailable: true }
        ]
      } 
    }
  );
  console.log('Updated text/image references for Energia:', update8.modifiedCount);

  // Delete all remaining Metro Cafe and Metro Cafe Counter shops (1 to 50)
  const deleteResult = await Shop.deleteMany({
    shopName: { 
      $regex: /^Metro Cafe\s*(Counter\s*)?\d+$/i 
    }
  });
  console.log('Deleted remaining Metro Cafe shops:', deleteResult.deletedCount);

  console.log('Shops updated successfully');
  process.exit(0);
}

run().catch(console.error);
