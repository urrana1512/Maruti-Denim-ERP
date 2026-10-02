const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const roleRoutes = require('./routes/roleRoutes');
const gatePassRoutes = require('./routes/gatePassRoutes');
const materialInwardRoutes = require('./routes/materialInwardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const masterDataRoutes = require('./routes/masterDataRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin or any localhost origin
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  skip: (req) => {
    const ip = req.ip || req.connection?.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1') || process.env.NODE_ENV !== 'production';
  },
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Cookie Parser & Body Parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Core API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gate-passes', gatePassRoutes);
app.use('/api/material-inward', materialInwardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/master-data', masterDataRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Maruti Denim Gate Pass Enterprise API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

module.exports = app;
