const mongoose = require('mongoose');

const MetroKnowledgeBaseSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    default: '1.0'
  },
  stations: {
    type: Object, // Array of stations or object map
    default: {}
  },
  routes: {
    type: Object,
    default: {}
  },
  fares: {
    type: Object,
    default: {}
  },
  timings: {
    type: Object,
    default: {}
  },
  rules: {
    type: Object,
    default: {}
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MetroKnowledgeBase', MetroKnowledgeBaseSchema);
