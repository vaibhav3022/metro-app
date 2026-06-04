const mongoose = require('mongoose');

const MetroRouteSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: true, // e.g., 'Purple Line'
    trim: true
  },
  stations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MetroStation'
  }],
  baseFare: {
    type: Number,
    required: true,
    default: 10
  },
  perStationFare: {
    type: Number,
    required: true,
    default: 5
  },
  firstTrainTime: {
    type: String,
    default: '06:00 AM'
  },
  lastTrainTime: {
    type: String,
    default: '10:00 PM'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MetroRoute', MetroRouteSchema);
