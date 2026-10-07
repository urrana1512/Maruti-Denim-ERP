const { getTenantModels, getSuperAdminModels } = require('../config/connectionManager');

/**
 * Enterprise Notification Service with Idempotency Support
 */
const notificationService = {
  /**
   * Create a Tenant / User Notification
   */
  createNotification: async ({
    recipientUserId = null,
    toAdmins = false,
    companyCode = 'maruti_nandan',
    type,
    title,
    message,
    category = 'System',
    priority = 'Normal',
    relatedModule = 'SYSTEM',
    relatedRecordId = '',
    actionUrl = '',
    eventKey = null,
    metadata = {}
  }) => {
    try {
      if (!companyCode) return null;
      const tenantModels = getTenantModels(companyCode);
      const { Notification, User, Role } = tenantModels;

      // Idempotency Check
      if (eventKey) {
        const existing = await Notification.findOne({ eventKey, companyCode });
        if (existing) {
          return existing;
        }
      }

      // Safe metadata stripping sensitive credentials
      const safeMetadata = { ...metadata };
      delete safeMetadata.password;
      delete safeMetadata.otp;
      delete safeMetadata.token;
      delete safeMetadata.jwt;

      // If notifying all admins of company
      if (toAdmins && !recipientUserId) {
        const adminRole = await Role.findOne({ $or: [{ code: 'admin' }, { name: 'Admin' }] });
        const adminUsers = await User.find({
          $or: [{ role: adminRole?._id }, { roleName: 'Admin' }, { roleName: 'Company Admin' }],
          status: 'ACTIVE'
        });

        const createdNotifications = [];
        for (const admin of adminUsers) {
          const itemKey = eventKey ? `${eventKey}:${admin._id.toString()}` : null;
          if (itemKey) {
            const exists = await Notification.findOne({ eventKey: itemKey, companyCode });
            if (exists) continue;
          }

          const notif = await Notification.create({
            recipientUserId: admin._id,
            companyCode,
            type,
            title,
            message,
            category,
            priority,
            relatedModule,
            relatedRecordId,
            actionUrl,
            eventKey: itemKey,
            metadata: safeMetadata
          });
          createdNotifications.push(notif);
        }
        return createdNotifications;
      }

      // Single Recipient Notification
      const notification = await Notification.create({
        recipientUserId,
        companyCode,
        type,
        title,
        message,
        category,
        priority,
        relatedModule,
        relatedRecordId,
        actionUrl,
        eventKey,
        metadata: safeMetadata
      });

      return notification;
    } catch (err) {
      console.error('[NotificationService] Error creating notification:', err.message);
      return null;
    }
  },

  /**
   * Create a Super Admin Platform Alert Notification
   */
  createSuperAdminAlert: async ({
    recipientUserId = null,
    type,
    title,
    message,
    category = 'Platform',
    priority = 'Normal',
    relatedModule = 'PLATFORM',
    relatedRecordId = '',
    actionUrl = '',
    eventKey = null,
    metadata = {}
  }) => {
    try {
      const { SuperAdminNotification } = getSuperAdminModels();

      if (eventKey) {
        const existing = await SuperAdminNotification.findOne({ eventKey });
        if (existing) return existing;
      }

      const safeMetadata = { ...metadata };
      delete safeMetadata.password;
      delete safeMetadata.token;

      const alert = await SuperAdminNotification.create({
        recipientUserId,
        companyCode: 'PLATFORM',
        type,
        title,
        message,
        category,
        priority,
        relatedModule,
        relatedRecordId,
        actionUrl,
        eventKey,
        metadata: safeMetadata
      });

      return alert;
    } catch (err) {
      console.error('[NotificationService] Error creating Super Admin alert:', err.message);
      return null;
    }
  }
};

module.exports = notificationService;
