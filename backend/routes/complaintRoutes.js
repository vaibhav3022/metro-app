const express = require('express');
const router = express.Router();
const { submitComplaint, getMyComplaints, deleteComplaint } = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { supportTicketSchema } = require('../schemas/ticketSchema');

router.post('/submit', protect, validate(supportTicketSchema), submitComplaint);
router.get('/', protect, getMyComplaints);
router.delete('/:id', protect, deleteComplaint);

module.exports = router;
