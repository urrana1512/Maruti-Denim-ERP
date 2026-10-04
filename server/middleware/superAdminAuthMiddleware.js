const jwt = require('jsonwebtoken');
const { getSuperAdminModels } = require('../config/connectionManager');
const { JWT_SECRET } = require('./authMiddleware');

const protectSuperAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.superAdminToken) {
    token = req.cookies.superAdminToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Super Admin session required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied. Super Admin privileges required.' });
    }

    const { SuperAdminUser } = getSuperAdminModels();
    const user = await SuperAdminUser.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Super Admin user account not found.' });
    }

    req.superAdmin = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Super Admin session expired or invalid.' });
  }
};

module.exports = { protectSuperAdmin };
