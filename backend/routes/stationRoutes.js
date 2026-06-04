const express = require('express');
const router = express.Router();
const { getStations, getStation, addStation, editStation, deleteStation, getFare } = require('../controllers/stationController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.get('/', getStations);
router.get('/:id', getStation);
router.get('/fare/:src/:dest', getFare);

router.use(protect, requireAdmin);
router.post('/', addStation);
router.put('/:id', editStation);
router.delete('/:id', deleteStation);

module.exports = router;
