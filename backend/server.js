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
const webhookRoutes = require('./routes/webhookRoutes');

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Pune Metro Transit Server API Gateway',
    status: 'Operational'
  });
});

// Mounting Sub-routers
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/smartcard', smartCardRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/webhooks', webhookRoutes);
// Fallback error catcher
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n===========================================`);
  console.log(`Pune Metro server running on port: ${PORT}`);
  console.log(`Database target URI configured.`);
  console.log(`===========================================\n`);
});
