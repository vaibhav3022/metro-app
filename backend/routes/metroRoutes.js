const express = require('express');
const router = express.Router();
const metroController = require('../controllers/metroController');

// Define route
router.get('/sync', metroController.syncMetroData);

module.exports = router;
