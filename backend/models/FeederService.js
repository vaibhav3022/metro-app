const mongoose = require('mongoose');

const feederServiceSchema = new mongoose.Schema({
  stationName: { type: String, required: true, unique: true },
  routes: [{
    destination: { type: String, required: true },
    busNumbers: [{ type: String }],
    frequency: { type: String, required: true },
    firstBus: { type: String, required: true },
    lastBus: { type: String, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('FeederService', feederServiceSchema);
