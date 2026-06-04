const mongoose = require('mongoose');
require('dotenv').config();
const Shop = require('./models/Shop');
const Merchant = require('./models/Merchant');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/punemetro';

const foodShops = [
  { name: "Pune Special Vada Pav", desc: "Authentic spicy vada pav with fried green chillies.", img: "https://images.unsplash.com/photo-1605493725785-3226db978351?w=500&q=80" }, // Burger/VadaPav placeholder
  { name: "Irani Chai & Bun Maska", desc: "Classic hot Irani chai with sweet bun maska.", img: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80" }, // Tea placeholder
  { name: "Metro Filter Coffee", desc: "Strong South Indian filter coffee to keep you awake.", img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=500&q=80" },
  { name: "Misal Pav Junction", desc: "Spicy Puneri Misal Pav served hot and fresh.", img: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&q=80" }, // Indian food placeholder
  { name: "Samosa Express", desc: "Crispy hot samosas with mint chutney.", img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80" }
];

const retailShops = [
  { name: "Metro Newsstand", desc: "Daily newspapers, magazines, and quick snacks.", img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80" },
  { name: "Mobile Accessories", desc: "Chargers, earphones, and mobile covers on the go.", img: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80" },
  { name: "Travel Essentials", desc: "Water bottles, umbrellas, and travel gear.", img: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=500&q=80" }
];

async function patchShops() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB...');

  const shops = await Shop.find();
  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i];
    let template;
    
    // Explicitly make the first few Vada Pav to satisfy the user request
    if (i === 0 || i === 5) {
      template = foodShops[0];
      shop.category = 'Food';
    } else if (shop.category === 'Food') {
      template = foodShops[i % foodShops.length];
    } else {
      template = retailShops[i % retailShops.length];
    }

    shop.shopName = template.name;
    shop.description = template.desc;
    shop.imageUrl = template.img;

    await shop.save();

    // Sync businessName in Merchant model
    await Merchant.findByIdAndUpdate(shop.merchantId, { businessName: template.name });
  }

  console.log('Shops successfully patched with descriptions and images!');
  process.exit(0);
}

patchShops();
