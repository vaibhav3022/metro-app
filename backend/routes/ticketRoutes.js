const express = require('express');
const {
  calculateFare,
  createTicket,
  createRazorpayOrder,
  processPayment,
  getTicketHistory,
  getTicketById,
  verifyTicket,
  expireTicket
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { bookTicketSchema } = require('../schemas/ticketSchema');

const router = express.Router();

router.post('/calculate-fare', calculateFare);
router.post('/create', protect, validate(bookTicketSchema), createTicket);
router.post('/create-razorpay-order', protect, createRazorpayOrder);
router.post('/payment', protect, processPayment);
router.get('/history', protect, getTicketHistory);
router.post('/verify-qr', verifyTicket);
router.get('/:id', protect, getTicketById);
router.post('/expire/:id', protect, expireTicket);

module.exports = router;
