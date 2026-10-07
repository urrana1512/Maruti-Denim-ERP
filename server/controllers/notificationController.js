const { resolveModels } = require('../config/connectionManager');

// GET user / admin notifications
const getNotifications = async (req, res) => {
  try {
    const { Notification } = resolveModels(req);
    const user = req.user;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const { isRead, category, priority, search } = req.query;

    const roleCode = user.role?.code;
    const roleName = user.roleName || user.role?.name;
    const isAdmin = roleCode === 'admin' || roleName === 'Admin' || roleName === 'Company Admin';

    // Role-scoped query
    const query = {
      companyCode: req.companyCode
    };

    if (isAdmin) {
      query.$or = [
        { recipientUserId: user._id },
        { recipientUserId: null }
      ];
    } else {
      query.recipientUserId = user._id;
    }

    if (isRead !== undefined && isRead !== '') {
      query.isRead = isRead === 'true';
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (priority && priority !== 'ALL') {
      query.priority = priority;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = (query.$and || []).concat([{
        $or: [
          { title: searchRegex },
          { message: searchRegex },
          { relatedRecordId: searchRegex }
        ]
      }]);
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notifications.' });
  }
};

// GET unread notifications count
const getUnreadCount = async (req, res) => {
  try {
    const { Notification } = resolveModels(req);
    const user = req.user;

    const roleCode = user.role?.code;
    const roleName = user.roleName || user.role?.name;
    const isAdmin = roleCode === 'admin' || roleName === 'Admin' || roleName === 'Company Admin';

    const query = {
      companyCode: req.companyCode,
      isRead: false
    };

    if (isAdmin) {
      query.$or = [
        { recipientUserId: user._id },
        { recipientUserId: null }
      ];
    } else {
      query.recipientUserId = user._id;
    }

    const count = await Notification.countDocuments(query);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, count: 0 });
  }
};

// PATCH mark single notification as read
const markAsRead = async (req, res) => {
  try {
    const { Notification } = resolveModels(req);
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      companyCode: req.companyCode
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read.', notification });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

// PATCH mark all as read
const markAllAsRead = async (req, res) => {
  try {
    const { Notification } = resolveModels(req);
    const user = req.user;

    const roleCode = user.role?.code;
    const roleName = user.roleName || user.role?.name;
    const isAdmin = roleCode === 'admin' || roleName === 'Admin' || roleName === 'Company Admin';

    const query = {
      companyCode: req.companyCode,
      isRead: false
    };

    if (isAdmin) {
      query.$or = [
        { recipientUserId: user._id },
        { recipientUserId: null }
      ];
    } else {
      query.recipientUserId = user._id;
    }

    await Notification.updateMany(query, {
      $set: { isRead: true, readAt: new Date() }
    });

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' });
  }
};

// DELETE single notification
const deleteNotification = async (req, res) => {
  try {
    const { Notification } = resolveModels(req);
    const { id } = req.params;

    const result = await Notification.deleteOne({
      _id: id,
      companyCode: req.companyCode
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.json({ success: true, message: 'Notification removed.' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
