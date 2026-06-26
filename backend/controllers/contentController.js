const TouristPlace = require('../models/TouristPlace');
const FeederService = require('../models/FeederService');
const Station = require('../models/Station');

// PUBLIC ENDPOINTS

exports.getTouristPlaces = async (req, res) => {
  try {
    const places = await TouristPlace.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: places });
  } catch (err) {
    console.error('getTouristPlaces error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getFeederServices = async (req, res) => {
  try {
    const services = await FeederService.find().sort({ stationName: 1 });
    res.status(200).json({ success: true, data: services });
  } catch (err) {
    console.error('getFeederServices error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ADMIN CMS ENDPOINTS

// Tourist Places
exports.addTouristPlace = async (req, res) => {
  try {
    const place = await TouristPlace.create(req.body);
    res.status(201).json({ success: true, data: place });
  } catch (err) {
    console.error('addTouristPlace error:', err);
    res.status(400).json({ success: false, message: 'Failed to add place' });
  }
};

exports.updateTouristPlace = async (req, res) => {
  try {
    const place = await TouristPlace.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    res.status(200).json({ success: true, data: place });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update place' });
  }
};

exports.deleteTouristPlace = async (req, res) => {
  try {
    const place = await TouristPlace.findByIdAndDelete(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to delete place' });
  }
};

// Feeder Services
exports.addFeederService = async (req, res) => {
  try {
    const service = await FeederService.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to add service' });
  }
};

exports.updateFeederService = async (req, res) => {
  try {
    const service = await FeederService.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.status(200).json({ success: true, data: service });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update service' });
  }
};

exports.deleteFeederService = async (req, res) => {
  try {
    const service = await FeederService.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to delete service' });
  }
};
