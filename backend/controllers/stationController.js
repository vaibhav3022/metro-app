const Station = require('../models/Station');
const AuditLog = require('../models/AuditLog');

const getStations = async (req, res) => {
  try {
    const { search, line } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (line) query.metroLine = line;

    const stations = await Station.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, data: stations });
  } catch (err) { res.status(500).json({ success: false }); }
};

const getStation = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: station });
  } catch (err) { res.status(500).json({ success: false }); }
};

const addStation = async (req, res) => {
  try {
    const station = await Station.create(req.body);
    await AuditLog.create({ action: 'ADD_STATION', performedBy: req.user._id, targetId: station._id, targetModel: 'Station', details: req.body });
    res.status(201).json({ success: true, data: station });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

const editStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!station) return res.status(404).json({ success: false, message: 'Not found' });
    await AuditLog.create({ action: 'EDIT_STATION', performedBy: req.user._id, targetId: station._id, targetModel: 'Station', details: req.body });
    res.status(200).json({ success: true, data: station });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

const deleteStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndDelete(req.params.id);
    if (!station) return res.status(404).json({ success: false, message: 'Not found' });
    await AuditLog.create({ action: 'DELETE_STATION', performedBy: req.user._id, targetId: station._id, targetModel: 'Station', details: {} });
    res.status(200).json({ success: true, message: 'Station deleted' });
  } catch (err) { res.status(500).json({ success: false }); }
};

const getFare = async (req, res) => {
  try {
    const { src, dest } = req.params;
    // Simple mock logic: fixed fare or random
    const fare = Math.floor(Math.random() * 40) + 10; 
    res.status(200).json({ success: true, fare });
  } catch (err) { res.status(500).json({ success: false }); }
};

module.exports = { getStations, getStation, addStation, editStation, deleteStation, getFare };
