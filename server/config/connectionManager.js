const mongoose = require('mongoose');

// Import Tenant Models
const User = require('../models/User');
const Role = require('../models/Role');
const GatePass = require('../models/GatePass');
const MaterialInward = require('../models/MaterialInward');
const Otp = require('../models/Otp');
const AuditLog = require('../models/AuditLog');
const ItemMaster = require('../models/ItemMaster');
const VendorMaster = require('../models/VendorMaster');
const MasterDataAudit = require('../models/MasterDataAudit');
const GatePassAudit = require('../models/GatePassAudit');

// Import Super Admin Schemas
const companySchema = require('../models/superadmin/Company');
const superAdminUserSchema = require('../models/superadmin/SuperAdminUser');
const superAdminAuditLogSchema = require('../models/superadmin/SuperAdminAuditLog');

// Connection & Model Cache Maps
const tenantConnections = {};
const tenantModelCache = {};
let superAdminConnection = null;
let superAdminModels = null;

// Company DB Mapping Dictionary (Default initial 3 companies)
const DEFAULT_COMPANY_DB_MAP = {
  maruti_nandan: 'maruti_nandan_db',
  shri_ram: 'shri_ram_cot_fab_db',
  balaji_polycot: 'balaji_polycot_db'
};

/**
 * Construct Database URI replacing database name cleanly
 */
function getDatabaseUri(dbName) {
  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/maruti_denim';
  const queryIndex = uri.indexOf('?');
  let queryStr = '';
  if (queryIndex !== -1) {
    queryStr = uri.substring(queryIndex);
    uri = uri.substring(0, queryIndex);
  }
  const lastSlash = uri.lastIndexOf('/');
  let base = uri;
  if (lastSlash > uri.indexOf('://') + 2) {
    base = uri.substring(0, lastSlash);
  }
  return `${base}/${dbName}${queryStr}`;
}

/**
 * Get or initialize Super Admin database connection
 */
function getSuperAdminConnection() {
  if (superAdminConnection && superAdminConnection.readyState === 1) {
    return superAdminConnection;
  }
  const uri = getDatabaseUri('gatepass_superadmin_db');
  superAdminConnection = mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 });
  
  superAdminConnection.on('error', (err) => {
    console.error(`[ConnectionManager] SuperAdmin DB error: ${err.message}`);
  });
  
  return superAdminConnection;
}

/**
 * Get Super Admin Mongoose models bound to Super Admin connection
 */
function getSuperAdminModels() {
  if (superAdminModels) {
    return superAdminModels;
  }
  const conn = getSuperAdminConnection();
  superAdminModels = {
    Company: conn.models.Company || conn.model('Company', companySchema),
    SuperAdminUser: conn.models.SuperAdminUser || conn.model('SuperAdminUser', superAdminUserSchema),
    SuperAdminAuditLog: conn.models.SuperAdminAuditLog || conn.model('SuperAdminAuditLog', superAdminAuditLogSchema)
  };
  return superAdminModels;
}

/**
 * Get or create connection to a tenant database
 */
function getTenantConnection(companyCode, customDbName = null) {
  const code = (companyCode || 'maruti_nandan').toLowerCase().trim();
  const dbName = customDbName || DEFAULT_COMPANY_DB_MAP[code] || `${code}_db`;

  if (tenantConnections[code] && tenantConnections[code].readyState === 1) {
    return tenantConnections[code];
  }

  const uri = getDatabaseUri(dbName);
  const conn = mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 });

  conn.on('error', (err) => {
    console.error(`[ConnectionManager] Tenant DB error (${code}): ${err.message}`);
  });

  tenantConnections[code] = conn;
  return conn;
}

/**
 * Get tenant-scoped Mongoose models compiled on tenant database connection
 */
function getTenantModels(companyCode, customDbName = null) {
  const code = (companyCode || 'maruti_nandan').toLowerCase().trim();
  
  if (tenantModelCache[code]) {
    return tenantModelCache[code];
  }

  const conn = getTenantConnection(code, customDbName);

  const models = {
    User: conn.models.User || conn.model('User', User.schema),
    Role: conn.models.Role || conn.model('Role', Role.schema),
    GatePass: conn.models.GatePass || conn.model('GatePass', GatePass.schema),
    MaterialInward: conn.models.MaterialInward || conn.model('MaterialInward', MaterialInward.schema),
    Otp: conn.models.Otp || conn.model('Otp', Otp.schema),
    AuditLog: conn.models.AuditLog || conn.model('AuditLog', AuditLog.schema),
    ItemMaster: conn.models.ItemMaster || conn.model('ItemMaster', ItemMaster.schema),
    VendorMaster: conn.models.VendorMaster || conn.model('VendorMaster', VendorMaster.schema),
    MasterDataAudit: conn.models.MasterDataAudit || conn.model('MasterDataAudit', MasterDataAudit.schema),
    GatePassAudit: conn.models.GatePassAudit || conn.model('GatePassAudit', GatePassAudit.schema)
  };

  tenantModelCache[code] = models;
  return models;
}

/**
 * Helper to resolve models from Express req or fallback
 */
function resolveModels(req) {
  if (req && req.tenantModels) {
    return req.tenantModels;
  }
  const rawCode = req?.companyCode || req?.user?.companyCode || req?.body?.companyCode || req?.headers?.['x-company-code'] || 'maruti_nandan';
  const companyCode = String(rawCode).toLowerCase().trim();
  return getTenantModels(companyCode);
}

module.exports = {
  getSuperAdminConnection,
  getSuperAdminModels,
  getTenantConnection,
  getTenantModels,
  resolveModels,
  DEFAULT_COMPANY_DB_MAP
};
