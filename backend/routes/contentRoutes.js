const express = require('express');
const router = express.Router();
const {
  getTouristPlaces,
  getFeederServices,
  addTouristPlace,
  updateTouristPlace,
  deleteTouristPlace,
  addFeederService,
  updateFeederService,
  deleteFeederService
} = require('../controllers/contentController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const Banner = require('../models/Banner');

// Public endpoints
router.get('/public/tourist-places', getTouristPlaces);
router.get('/public/feeder-services', getFeederServices);
router.get('/public/banners', async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true });
    res.status(200).json({ success: true, data: banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin CMS endpoints
router.use('/admin', protect, requireAdmin);
router.post('/admin/tourist-places', addTouristPlace);
router.put('/admin/tourist-places/:id', updateTouristPlace);
router.delete('/admin/tourist-places/:id', deleteTouristPlace);

router.post('/admin/feeder-services', addFeederService);
router.put('/admin/feeder-services/:id', updateFeederService);
router.delete('/admin/feeder-services/:id', deleteFeederService);

module.exports = router;
