const Ticket = require('../models/Ticket');
const Wallet = require('../models/Wallet');
const { calculateFare: computeFare, calculateDistance } = require('../utils/fareCalculator');
const { encryptQR, decryptQR } = require('../utils/generateQR');
const { createBreaker } = require('../utils/circuitBreaker');
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

// Wrap razorpay call
async function callRazorpayOrderCreate(options) {
  return await razorpay.orders.create(options);
}
const razorpayBreaker = createBreaker(callRazorpayOrderCreate);
razorpayBreaker.fallback(() => ({ id: 'fallback_order_id', amount: 0, currency: 'INR' }));

// @desc    Calculate ticket fare
// @route   POST /api/tickets/calculate-fare
// @access  Public
const calculateFare = async (req, res) => {
  const { source, destination, passengers, isReturn, isMember } = req.body;

  if (!source || !destination) {
    return res.status(400).json({ message: 'Source and destination stations are required.' });
  }

  try {
    const passengersCount = parseInt(passengers) || 1;
    const returnFlag = isReturn === true || isReturn === 'true';
    const fareInfo = computeFare(source, destination, passengersCount, returnFlag);
    
    res.status(200).json({ success: true, ...fareInfo });
  } catch (error) {
    console.error('Calculate Fare Error:', error);
    res.status(500).json({ message: 'Server error computing fares.' });
  }
};

// @desc    Create a pending ticket record
// @route   POST /api/tickets/create
// @access  Private
const createTicket = async (req, res) => {
  const { source, destination, distance, fare, passengers, totalAmount, isReturn } = req.body;

  if (!source || !destination || !fare || !passengers || !totalAmount) {
    return res.status(400).json({ message: 'Missing required booking attributes.' });
  }

  try {
    const timestamp = Date.now();
    const ticketId = `PMA${timestamp}`;

    const newTicket = new Ticket({
      userId: req.user.id,
      ticketId,
      source,
      destination,
      distance,
      fare,
      passengers,
      totalAmount,
      isReturn: isReturn || false,
      paymentStatus: 'pending',
      ticketStatus: 'active', // default active upon generation
      travelDate: new Date()
    });

    await newTicket.save();

    res.status(201).json({
      success: true,
      message: 'Pending ticket ticket created successfully.',
      ticket: newTicket
    });
  } catch (error) {
    console.error('Create Ticket Error:', error);
    res.status(500).json({ message: 'Server error initiating ticket booking.' });
  }
};

// @desc    Create a Razorpay Order for payment
// @route   POST /api/tickets/create-razorpay-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ message: 'Amount is required to create order.' });
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_ticket_${Date.now()}`
    };

    let order;
    if (process.env.RAZORPAY_KEY_SECRET === 'puneMetroRazorSecret123') {
      // Mock order creation for development/testing if dummy secret is used
      order = {
        id: `order_mock_${Date.now()}`,
        amount: options.amount,
        currency: options.currency
      };
    } else {
      order = await razorpayBreaker.fire(options);
    }

    res.status(200).json({
      success: true,
      orderId: order.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Create Razorpay Order Error:', error);
    res.status(500).json({ message: 'Server error creating Razorpay order.' });
  }
};

// @desc    Process ticket payment authorization
// @route   POST /api/tickets/payment
// @access  Private
const processPayment = async (req, res) => {
  const { 
    ticketId, 
    paymentId, 
    paymentMethod, 
    paymentStatus, 
    razorpayOrderId, 
    razorpaySignature 
  } = req.body;

  if (!ticketId || !paymentStatus) {
    return res.status(400).json({ message: 'Ticket ID and payment status are required.' });
  }

  try {
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket record not found.' });
    }

    if (paymentStatus === 'success') {
      // 1. If wallet payment, deduct balance
      if (paymentMethod === 'wallet') {
        const wallet = await Wallet.findOne({ userId: req.user.id });
        if (!wallet || wallet.balance < ticket.totalAmount) {
          return res.status(400).json({ message: 'Insufficient wallet balance for payment.' });
        }

        // Deduct
        wallet.balance -= ticket.totalAmount;
        wallet.transactions.push({
          type: 'debit',
          amount: ticket.totalAmount,
          description: `Metro Ticket: ${ticket.source} to ${ticket.destination}`,
          date: new Date()
        });
        await wallet.save();
      } else {
        // Stripe Payment Method
        // Ideally we verify paymentIntent status via Stripe API here, but for test mode we trust frontend success status.
        if (req.body.paymentIntentId) {
           const intent = await stripe.paymentIntents.retrieve(req.body.paymentIntentId);
           if (intent.status !== 'succeeded') {
             return res.status(400).json({ message: 'Stripe payment not successful.' });
           }
        }
      }

      // 2. Authorize Ticket & generate QR
      ticket.paymentId = paymentId || `MOCK-PAY-${Date.now()}`;
      ticket.paymentStatus = 'success';
      ticket.ticketStatus = 'active';

      // Generate secure QR payload
      const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours validity
      const qrPayload = {
        ticketId: ticket.ticketId,
        source: ticket.source,
        destination: ticket.destination,
        passengers: ticket.passengers,
        isReturn: ticket.isReturn || false,
        validUntil: validUntil.toISOString()
      };

      ticket.qrData = encryptQR(qrPayload);
      await ticket.save();

      // 3. Issue Cashback for Premium Members
      let wallet = await Wallet.findOne({ userId: req.user.id });
      if (!wallet) {
        wallet = new Wallet({ userId: req.user.id, balance: 0, transactions: [] });
      }

      // Find user to check role
      const buyer = await require('../models/User').findById(req.user.id);
      let cashbackEarned = 0;
      let newNxlCredits = buyer ? (buyer.nxlCredits || 0) : 0;
      
      if (buyer) {
        // 5% cashback for all users (promotional / testing), minimum 1 NXL credit
        const cashbackAmount = Math.max(1, Math.floor(ticket.totalAmount * 0.05));
        
        if (cashbackAmount > 0) {
          cashbackEarned = cashbackAmount;
          // Add to user wallet
          wallet.balance += cashbackAmount;
          wallet.transactions.push({
            type: 'credit',
            amount: cashbackAmount,
            description: `Premium Member 5% Cashback for Metro Ticket (${ticket.source} to ${ticket.destination}) | Ticket Price: ₹${ticket.totalAmount}`,
            date: new Date()
          });

          // Add to NXL Credits
          buyer.nxlCredits = (buyer.nxlCredits || 0) + cashbackAmount;
          buyer.lifetimeCashback = (buyer.lifetimeCashback || 0) + cashbackAmount;
          newNxlCredits = buyer.nxlCredits;
          await buyer.save();

          // Deduct from Admin wallet
          const adminUser = await require('../models/User').findOne({ role: 'admin' });
          if (adminUser) {
            let adminWallet = await Wallet.findOne({ userId: adminUser._id });
            if (!adminWallet) {
               adminWallet = new Wallet({ userId: adminUser._id, balance: 100000, transactions: [] });
            }
            adminWallet.balance -= cashbackAmount;
            adminWallet.transactions.push({
              type: 'debit',
              amount: cashbackAmount,
              description: `Funded 5% cashback to premium user for ticket purchase (ID: ${ticket.ticketId})`,
              date: new Date()
            });
            await adminWallet.save();
          }
        }
      }
      await wallet.save();

      return res.status(200).json({
        success: true,
        message: 'Payment completed and ticket activated.',
        ticket,
        cashbackEarned,
        newNxlCredits
      });
    } else {
      ticket.paymentStatus = 'failed';
      ticket.ticketStatus = 'failed';
      await ticket.save();
      return res.status(400).json({ message: 'Payment authorization failed.', ticket });
    }
  } catch (error) {
    console.error('Process Payment Error:', error);
    res.status(500).json({ message: 'Server error processing payment transaction.' });
  }
};

// @desc    Retrieve ticket history for user
// @route   GET /api/tickets/history
// @access  Private
const getTicketHistory = async (req, res) => {
  try {
    // Only fetch tickets where payment was successful — excludes pending/failed attempts
    const tickets = await Ticket.find({ userId: req.user.id, paymentStatus: 'success' }).sort({ createdAt: -1 });

    const currentDateString = new Date().toDateString();
    
    let updatedTickets = [];
    for (let ticket of tickets) {
      if ((ticket.ticketStatus === 'active' || ticket.ticketStatus === 'entered') && 
          new Date(ticket.createdAt).toDateString() !== currentDateString) {
        ticket.ticketStatus = 'expired';
        await ticket.save();
      }
      updatedTickets.push(ticket);
    }

    res.status(200).json({ success: true, tickets: updatedTickets });
  } catch (error) {
    console.error('Fetch History Error:', error);
    res.status(500).json({ message: 'Server error fetching tickets list.' });
  }
};

// @desc    Retrieve specific ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
  try {
    let ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    const currentDateString = new Date().toDateString();
    if ((ticket.ticketStatus === 'active' || ticket.ticketStatus === 'entered') && 
        new Date(ticket.createdAt).toDateString() !== currentDateString) {
      ticket.ticketStatus = 'expired';
      await ticket.save();
    }

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error('Fetch Ticket Details Error:', error);
    res.status(500).json({ message: 'Server error fetching ticket.' });
  }
};

// @desc    Verify QR ticket at Smart scanner barriers
// @route   POST /api/tickets/verify-qr
// @access  Public (Simulates scanning gate hardware)
const verifyTicket = async (req, res) => {
  const { qrData, scanType = 'entry', currentStation } = req.body;

  if (!qrData) {
    return res.status(400).json({ message: 'QR data is required for validation.' });
  }

  try {
    // 1. Decrypt QR String
    const qrPayload = decryptQR(qrData);
    if (!qrPayload || !qrPayload.ticketId) {
      return res.status(400).json({ message: 'Gate Denied: Encrypted transit data signature invalid or missing ticket ID.' });
    }

    const { ticketId, validUntil } = qrPayload;

    // 2. Fetch ticket from DB
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: 'Gate Denied: Ticket record missing in registry.' });
    }

    // 3. Expiry and Same Day checks
    const currentDateString = new Date().toDateString();
    if (new Date(ticket.createdAt).toDateString() !== currentDateString) {
      ticket.ticketStatus = 'expired';
      await ticket.save();
      return res.status(400).json({ message: 'Gate Denied: Ticket has expired. Same day validity only.' });
    }

    if (ticket.ticketStatus === 'used') {
      return res.status(400).json({ message: 'Gate Denied: This QR ticket has already been used for exit.' });
    }

    if (ticket.ticketStatus === 'expired' || (validUntil && new Date(validUntil) < new Date())) {
      ticket.ticketStatus = 'expired';
      await ticket.save();
      return res.status(400).json({ message: 'Gate Denied: Ticket validity period expired.' });
    }

    const currentTime = Date.now();

    // 4. Entry Logic
    if (scanType === 'entry') {
      if (ticket.ticketStatus === 'entered') {
        return res.status(400).json({ message: 'Gate Denied: You have already entered the station. Same QR cannot be used for entry twice.' });
      }
      
      const twentyMins = 20 * 60 * 1000;
      if (currentTime - new Date(ticket.createdAt).getTime() > twentyMins) {
        return res.status(400).json({ message: 'Gate Denied: Entry must be within 20 minutes of ticket purchase. Please purchase a new ticket.' });
      }

      ticket.ticketStatus = 'entered';
      ticket.entryTime = new Date();
      await ticket.save();

      return res.status(200).json({
        success: true,
        message: 'Gate Cleared: Welcoming aboard Pune Metro!',
        boardingDetails: {
          ticketId,
          source: ticket.source,
          destination: ticket.destination,
          passengers: ticket.passengers
        }
      });
    }

    // 5. Exit Logic
    if (scanType === 'exit') {
      if (ticket.ticketStatus !== 'entered') {
        return res.status(400).json({ message: 'Gate Denied: You must scan at the Entry Gate before exiting.' });
      }

      const ninetyMins = 90 * 60 * 1000;
      if (ticket.entryTime && currentTime - new Date(ticket.entryTime).getTime() > ninetyMins) {
        return res.status(400).json({ message: 'Gate Denied: Time limit of 90 minutes exceeded. Extra charge applicable. Please contact customer care.' });
      }

      // Check destination if provided
      if (currentStation && ticket.destination && currentStation.toLowerCase() !== ticket.destination.toLowerCase()) {
         return res.status(400).json({ message: `Gate Denied: Wrong destination. Your ticket is for ${ticket.destination}. Extra charge applicable.` });
      }

      ticket.ticketStatus = 'used';
      ticket.exitTime = new Date();
      await ticket.save();

      return res.status(200).json({
        success: true,
        message: 'Gate Cleared: Thank you for travelling with Pune Metro!',
        boardingDetails: {
          ticketId,
          source: ticket.source,
          destination: ticket.destination,
          passengers: ticket.passengers
        }
      });
    }

    return res.status(400).json({ message: 'Invalid scan type.' });
  } catch (error) {
    console.error('Verify Ticket Error:', error);
    res.status(500).json({ message: 'Server error during QR barrier verification.', error: error.message || String(error) });
  }
};

// @desc    Force expire a ticket (For testing purposes)
// @route   POST /api/tickets/expire/:id
// @access  Private
const expireTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.id, userId: req.user.id });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    ticket.ticketStatus = 'expired';
    await ticket.save();

    res.status(200).json({ success: true, message: 'Ticket expired successfully.', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error expiring ticket.' });
  }
};

module.exports = {
  calculateFare,
  createTicket,
  createRazorpayOrder,
  processPayment,
  getTicketHistory,
  getTicketById,
  verifyTicket,
  expireTicket
};
