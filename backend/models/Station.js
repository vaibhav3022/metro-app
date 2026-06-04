const mongoose = require('mongoose');

const StationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    trim: true
  },
  metroLine: {
    type: String,
    enum: ['Line 1', 'Line 2', 'Line 3']
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  fareTo: [{
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
    fare: { type: Number, required: true }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Station', StationSchema);
