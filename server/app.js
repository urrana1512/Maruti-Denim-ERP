const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const companyRoutes = require('./routes/companyRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const roleRoutes = require('./routes/roleRoutes');
const gatePassRoutes = require('./routes/gatePassRoutes');
const materialInwardRoutes = require('./routes/materialInwardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const masterDataRoutes = require('./routes/masterDataRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const tenantMiddleware = require('./middleware/tenantMiddleware');

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

const profileRoutes = require('./routes/profileRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');

// Serve static uploaded avatars safely
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Platform Level Routes (Public & Super Admin)
app.use('/api/companies', companyRoutes);
app.use('/api/superadmin', superAdminRoutes);

// Tenant-Scoped Operational API Routes (using tenantMiddleware)
app.use('/api/auth', tenantMiddleware, authRoutes);
app.use('/api/admin', tenantMiddleware, adminRoutes);
app.use('/api/roles', tenantMiddleware, roleRoutes);
app.use('/api/dashboard', tenantMiddleware, dashboardRoutes);
app.use('/api/gate-passes', tenantMiddleware, gatePassRoutes);
app.use('/api/material-inward', tenantMiddleware, materialInwardRoutes);
app.use('/api/reports', tenantMiddleware, reportRoutes);
app.use('/api/master-data', tenantMiddleware, masterDataRoutes);
app.use('/api/profile', tenantMiddleware, profileRoutes);
app.use('/api/notifications', tenantMiddleware, notificationRoutes);
app.use('/api/audit-logs', tenantMiddleware, auditLogRoutes);

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
