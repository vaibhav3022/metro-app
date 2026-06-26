const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TouristPlace = require('../models/TouristPlace');
const FeederService = require('../models/FeederService');
const Station = require('../models/Station');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const TOURIST_PLACES = [
  {
    id: '1',
    name: 'Shaniwar Wada (शनिवार वाडा)',
    station: 'PMC / Budhwar Peth',
    line: 'Aqua Line / Purple Line',
    lineColor: '#00897B',
    distance: '500 meters',
    shortDesc: 'Historic fortification built in 1732. Seat of the Peshwas.',
    longDesc: `Shaniwar Wada is a historical fortification in the city of Pune in Maharashtra, India. Built in 1732...`,
    images: ['shaniwar_wada.png', 'shaniwar_wada.png'],
    timings: '08:00 AM - 06:30 PM',
    entryFee: '₹25 (Indians), ₹300 (Foreigners)',
    coordinates: { latitude: 18.5195, longitude: 73.8553 }
  },
  {
    id: '2',
    name: 'Dagdusheth Halwai Ganpati (दगडूशेठ गणपती)',
    station: 'Budhwar Peth',
    line: 'Purple Line',
    lineColor: '#6A1B9A',
    distance: '400 meters',
    shortDesc: 'World-famous Ganesh temple known for its divine idol and gold ornaments.',
    longDesc: `The Dagdusheth Halwai Ganpati Temple in Pune is dedicated to the Hindu God Ganesh...`,
    images: ['dagdusheth_ganpati.png', 'dagdusheth_ganpati.png'],
    timings: '06:00 AM - 11:00 PM',
    entryFee: 'Free',
    coordinates: { latitude: 18.5161, longitude: 73.8564 }
  }
];

const FEEDER_ROUTES = [
  {
    stationName: "Civil Court",
    routes: [
      { destination: "Shivajinagar Bus Stand", busNumbers: ["43", "45", "46"], frequency: "Every 10 mins", firstBus: "06:00 AM", lastBus: "10:30 PM" },
      { destination: "Swargate", busNumbers: ["2", "3", "11"], frequency: "Every 15 mins", firstBus: "06:30 AM", lastBus: "10:00 PM" }
    ]
  },
  {
    stationName: "PCMC",
    routes: [
      { destination: "Bhosari", busNumbers: ["348", "349"], frequency: "Every 15 mins", firstBus: "06:00 AM", lastBus: "10:00 PM" },
      { destination: "Nigdi", busNumbers: ["305", "306"], frequency: "Every 20 mins", firstBus: "06:30 AM", lastBus: "10:00 PM" }
    ]
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected.');

    await TouristPlace.deleteMany({});
    await TouristPlace.insertMany(TOURIST_PLACES);
    console.log('Tourist Places Seeded!');

    await FeederService.deleteMany({});
    await FeederService.insertMany(FEEDER_ROUTES);
    console.log('Feeder Services Seeded!');

    // Mock update some stations
    await Station.updateMany({}, { 
      $set: { 
        'facilities.hasParking': true,
        'facilities.hasWashroom': true
      }
    });
    console.log('Stations facilities updated!');

    process.exit();
  } catch (error) {
    console.error('Error with data import', error);
    process.exit(1);
  }
};

seedData();
