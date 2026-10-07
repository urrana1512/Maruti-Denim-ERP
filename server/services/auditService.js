const crypto = require('crypto');
const { getTenantModels, getSuperAdminModels } = require('../config/connectionManager');

/**
 * Enterprise Audit Logging Service with Hash-Chaining Tamper-Evidence
 */
const auditService = {
  /**
   * Log Tenant / User Operational Audit Event
   */
  logAuditEvent: async ({
    req = null,
    companyCode = 'maruti_nandan',
    userId = null,
    userName = 'System',
    userEmail = '',
    userRole = 'User',
    action,
    module = 'SYSTEM',
    description = '',
    entityType = '',
    entityId = '',
    targetId = '',
    oldValue = null,
    newValue = null,
    details = {},
    status = 'SUCCESS'
  }) => {
    try {
      const tenantModels = getTenantModels(companyCode);
      const { AuditLog } = tenantModels;

      // Extract user info from req if passed
      const finalUserId = userId || req?.user?._id || null;
      const finalUserName = userName !== 'System' ? userName : (req?.user?.name || 'System');
      const finalUserEmail = userEmail || req?.user?.email || '';
      const finalUserRole = userRole !== 'User' ? userRole : (req?.user?.roleName || req?.user?.role?.name || 'User');

      const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '';
      const userAgent = req?.headers?.['user-agent'] || '';

      // Strip sensitive credentials from oldValue, newValue, and details
      const sanitize = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const clean = Array.isArray(obj) ? [...obj] : { ...obj };
        delete clean.password;
        delete clean.currentPassword;
        delete clean.newPassword;
        delete clean.otp;
        delete clean.token;
        delete clean.jwt;
        delete clean.secret;
        return clean;
      };

      const safeOldValue = sanitize(oldValue);
      const safeNewValue = sanitize(newValue);
      const safeDetails = sanitize(details);

      // Fetch last audit log to get previousHash for tamper-evidence chain
      const lastLog = await AuditLog.findOne({ companyCode }).sort({ createdAt: -1 }).lean();
      const previousHash = lastLog?.hash || '0000000000000000000000000000000000000000000000000000000000000000';

      const timestamp = new Date().toISOString();
      const hashContent = `${previousHash}|${timestamp}|${companyCode}|${finalUserId}|${action}|${module}|${entityId}`;
      const hash = crypto.createHash('sha256').update(hashContent).digest('hex');

      const auditLog = await AuditLog.create({
        companyCode,
        userId: finalUserId,
        userName: finalUserName,
        userEmail: finalUserEmail,
        userRole: finalUserRole,
        action,
        module,
        description: description || `${action} action performed on ${module}`,
        entityType,
        entityId: String(entityId || targetId || ''),
        targetId: String(targetId || entityId || ''),
        oldValue: safeOldValue,
        newValue: safeNewValue,
        details: safeDetails,
        status,
        ipAddress,
        userAgent,
        previousHash,
        hash
      });

      return auditLog;
    } catch (err) {
      console.error('[AuditService] Error logging audit event:', err.message);
      return null;
    }
  },

  /**
   * Log Super Admin Platform Audit Event
   */
  logSuperAdminAudit: async ({
    req = null,
    userId = null,
    userName = 'Super Admin',
    userEmail = '',
    userRole = 'Root Super Admin',
    action,
    module = 'PLATFORM',
    companyCode = 'PLATFORM',
    description = '',
    entityType = '',
    entityId = '',
    oldValue = null,
    newValue = null,
    details = {},
    status = 'SUCCESS'
  }) => {
    try {
      const { SuperAdminAuditLog } = getSuperAdminModels();

      const finalUserId = userId || req?.superAdmin?._id?.toString() || null;
      const finalUserName = userName !== 'Super Admin' ? userName : (req?.superAdmin?.name || 'Super Admin');
      const finalUserEmail = userEmail || req?.superAdmin?.email || '';

      const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '';
      const userAgent = req?.headers?.['user-agent'] || '';

      const sanitize = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const clean = Array.isArray(obj) ? [...obj] : { ...obj };
        delete clean.password;
        delete clean.token;
        return clean;
      };

      const safeOldValue = sanitize(oldValue);
      const safeNewValue = sanitize(newValue);
      const safeDetails = sanitize(details);

      const lastLog = await SuperAdminAuditLog.findOne().sort({ createdAt: -1 }).lean();
      const previousHash = lastLog?.hash || '0000000000000000000000000000000000000000000000000000000000000000';

      const timestamp = new Date().toISOString();
      const hashContent = `${previousHash}|${timestamp}|${companyCode}|${finalUserId}|${action}|${module}|${entityId}`;
      const hash = crypto.createHash('sha256').update(hashContent).digest('hex');

      const log = await SuperAdminAuditLog.create({
        companyCode,
        userId: finalUserId,
        userName: finalUserName,
        userEmail: finalUserEmail,
        userRole,
        action,
        module,
        description: description || `${action} action performed on ${module}`,
        entityType,
        entityId: String(entityId || ''),
        oldValue: safeOldValue,
        newValue: safeNewValue,
        details: safeDetails,
        status,
        ipAddress,
        userAgent,
        previousHash,
        hash
      });

      return log;
    } catch (err) {
      console.error('[AuditService] Error logging Super Admin audit:', err.message);
      return null;
    }
  }
};

module.exports = auditService;
