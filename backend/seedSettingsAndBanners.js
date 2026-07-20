const mongoose = require('mongoose');
const SystemSettings = require('./models/SystemSettings');
const Banner = require('./models/Banner');

const seedSettingsAndBanners = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/punemetro', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected.');

    // 1. Seed System Settings
    const existingSettings = await SystemSettings.findOne();
    if (!existingSettings) {
      await SystemSettings.create({
        commissionRate: 2,
        cashbackRate: 5,
        ticketValidityMins: 20,
        journeyValidityMins: 90
      });
      console.log('Default System Settings seeded successfully.');
    } else {
      console.log('System Settings already exist.');
    }

    // 2. Seed Default Banners
    const bannersCount = await Banner.countDocuments();
    if (bannersCount === 0) {
      await Banner.create([
        {
          title: 'Smart Metro Travel',
          imageUrl: 'https://images.unsplash.com/photo-1541417901776-4f8903ef106d?w=800&q=80',
          linkUrl: 'https://www.punemetrorail.org/',
          isActive: true
        },
        {
          title: 'Retail Shops & Eateries',
          imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
          linkUrl: '',
          isActive: true
        },
        {
          title: 'Cashless QR Ticket Payments',
          imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=800&q=80',
          linkUrl: '',
          isActive: true
        }
      ]);
      console.log('Default dynamic banners seeded successfully.');
    } else {
      console.log('Dynamic banners already exist.');
    }

    mongoose.connection.close();
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedSettingsAndBanners();
