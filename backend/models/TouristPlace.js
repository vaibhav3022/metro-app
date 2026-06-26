const mongoose = require('mongoose');

const touristPlaceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  shortDesc: { type: String, required: true },
  longDesc: { type: String, required: true },
  line: { type: String, required: true },
  lineColor: { type: String, required: true },
  station: { type: String, required: true },
  distance: { type: String, required: true },
  images: [{ type: String }],
  timings: { type: String, required: true },
  entryFee: { type: String, required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('TouristPlace', touristPlaceSchema);
