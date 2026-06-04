const express = require('express');
const router = express.Router();
const { submitComplaint, getMyComplaints } = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');

router.post('/submit', protect, submitComplaint);
router.get('/', protect, getMyComplaints);

module.exports = router;
