require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const walletRoutes = require('./routes/walletRoutes');
const shopRoutes = require('./routes/shopRoutes');
const smartCardRoutes = require('./routes/smartCardRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const merchantRoutes = require('./routes/merchantRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const revenueRoutes = require('./routes/revenueRoutes');
const stationRoutes = require('./routes/stationRoutes');
const contentRoutes = require('./routes/contentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const metroRoutes = require('./routes/metroRoutes');
const giftCardRoutes = require('./routes/giftCardRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const healthRoutes = require('./routes/health');
const enquiryRoutes = require('./routes/enquiryRoutes');

const { applySecurity } = require('./config/security');
const { apiLimiter, authLimiter, paymentLimiter } = require('./middleware/rateLimiter');
const { setupGracefulShutdown } = require('./utils/gracefulShutdown');

// Connect to Database
connectDB();

const app = express();

// Security Middlewares
applySecurity(app);

// Middlewares
app.use(cors());
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl} - Body:`, JSON.stringify(req.body));
  next();
});
// express.json is already applied in security.js (with limit), but we keep urlencoded
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/otp', authLimiter);
app.use('/api/wallet/topup', paymentLimiter);
app.use('/api/tickets/book', paymentLimiter);

// Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Pune Metro Transit Server API Gateway',
    status: 'Operational'
  });
});

// Health Route
app.use('/health', healthRoutes);

// Mounting Sub-routers
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/smartcard', smartCardRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/metro', metroRoutes);
app.use('/api/giftcard', giftCardRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/enquiries', enquiryRoutes);
// Fallback error catcher
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n===========================================`);
  console.log(`Pune Metro server running on port: ${PORT}`);
  console.log(`Database target URI configured.`);
  console.log(`===========================================\n`);
});

setupGracefulShutdown(server);
