const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const JWT_SECRET = process.env.JWT_SECRET || 'maruti_denim_gate_pass_enterprise_secret_key_2026';

// Protect routes - verify user token & active approval status
const protect = async (req, res, next) => {
  let token;

  // Check header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no session token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).populate('role');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account no longer exists.' });
    }

    // Session invalidation check (e.g. password reset or admin status toggle)
    if (decoded.tokenVersion !== undefined && user.tokenVersion !== undefined) {
      if (decoded.tokenVersion < user.tokenVersion) {
        return res.status(401).json({
          success: false,
          message: 'Session has been invalidated due to password update or admin action. Please log in again.'
        });
      }
    }

    // Account status check
    if (user.status === 'PENDING_APPROVAL') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your registration is pending Admin approval. Please contact system administrator.' 
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({ 
        success: false, 
        message: `Your account registration was rejected. Reason: ${user.rejectionReason || 'Contact Admin'}` 
      });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been deactivated. Please contact administrator.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid or expired session token.' });
  }
};

// Check for Admin access
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  const roleCode = req.user.role?.code;
  const roleName = req.user.roleName || req.user.role?.name;

  if (roleCode === 'admin' || roleName === 'Admin') {
    return next();
  }

  return res.status(403).json({ 
    success: false, 
    message: 'Access denied. Administrator privileges required.' 
  });
};

// Check for explicit permissions
const checkPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const roleCode = req.user.role?.code;
    const roleName = req.user.roleName || req.user.role?.name;

    // Admin has implicit access to all permissions
    if (roleCode === 'admin' || roleName === 'Admin') {
      return next();
    }

    const userPermissions = req.user.role?.permissions || [];
    const hasAll = requiredPermissions.every(p => userPermissions.includes(p));

    if (!hasAll) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: You lack required permission (${requiredPermissions.join(', ')})` 
      });
    }

    next();
  };
};

// Soft authentication - populates req.user if token exists without throwing error
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).populate('role');
      if (user) {
        req.user = user;
      }
    } catch (e) {
      // ignore token verification errors in optional mode
    }
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  requireAdmin,
  checkPermission,
  JWT_SECRET
};
