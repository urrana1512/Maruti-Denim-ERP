const User = require('../models/User');
const Role = require('../models/Role');
const GatePass = require('../models/GatePass');
const MaterialInward = require('../models/MaterialInward');
const AuditLog = require('../models/AuditLog');
const ItemMaster = require('../models/ItemMaster');
const VendorMaster = require('../models/VendorMaster');
const { sendAccountApprovedEmail } = require('../services/emailService');

// @desc    Get Admin Dashboard Stats & Activity Feed
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin)
exports.getAdminDashboardStats = async (req, res) => {
  try {
    const totalGatePasses = await GatePass.countDocuments();
    const activeGatePasses = await GatePass.countDocuments({ status: 'active', returnStatus: { $ne: 'FULLY_RETURNED' } });
    const pendingGatePasses = await GatePass.countDocuments({ returnStatus: 'PENDING' });
    const closedGatePasses = await GatePass.countDocuments({ $or: [{ status: 'closed' }, { returnStatus: 'FULLY_RETURNED' }] });

    const totalUsers = await User.countDocuments();
    const pendingUserApprovals = await User.countDocuments({ status: 'PENDING_APPROVAL' });

    // Recent Gate Passes
    const recentGatePasses = await GatePass.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .select('gatePassNumber companyName passType returnStatus gatePassStatus status createdAt');

    // Activity Audit Log feed
    const recentActivities = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    // Chart Data: Status Breakdown
    const returnableBreakdown = [
      { name: 'Fully Returned / Closed', value: closedGatePasses, color: '#10b981' },
      { name: 'Partially Returned', value: await GatePass.countDocuments({ returnStatus: 'PARTIALLY_RETURNED' }), color: '#f59e0b' },
      { name: 'Pending Returnable', value: pendingGatePasses, color: '#ef4444' }
    ];

    res.status(200).json({
      success: true,
      stats: {
        totalGatePasses,
        activeGatePasses,
        pendingGatePasses,
        closedGatePasses,
        totalUsers,
        pendingUserApprovals
      },
      recentGatePasses,
      recentActivities,
      returnableBreakdown
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching admin stats.', error: error.message });
  }
};

// @desc    Get all users with search, filters, pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const { search, role, department, status, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (department && department !== 'ALL') {
      query.department = department;
    }

    if (role && role !== 'ALL') {
      query.roleName = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .populate('role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading user accounts.', error: error.message });
  }
};

// @desc    Approve Pending User
// @route   POST /api/admin/users/:id/approve
// @access  Private (Admin)
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    if (roleId) {
      const selectedRole = await Role.findById(roleId);
      if (selectedRole) {
        user.role = selectedRole._id;
        user.roleName = selectedRole.name;
      }
    }

    user.status = 'APPROVED';
    user.approvedAt = new Date();
    user.approvedBy = req.user.name;
    user.rejectionReason = '';
    await user.save();

    // Notify user via email
    await sendAccountApprovedEmail(user.email, user.name);

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.roleName,
      action: 'USER_APPROVED',
      module: 'USER',
      targetId: user._id.toString(),
      details: { targetName: user.name, targetEmail: user.email, assignedRole: user.roleName }
    });

    res.status(200).json({ success: true, message: `User ${user.name} has been approved successfully. Email notification sent.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error approving user.', error: error.message });
  }
};

// @desc    Reject Pending User
// @route   POST /api/admin/users/:id/reject
// @access  Private (Admin)
exports.rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason = 'Registration request declined by administrator.' } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    user.status = 'REJECTED';
    user.rejectionReason = rejectionReason;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Kill active sessions
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.roleName,
      action: 'USER_REJECTED',
      module: 'USER',
      targetId: user._id.toString(),
      details: { targetName: user.name, targetEmail: user.email, rejectionReason }
    });

    res.status(200).json({ success: true, message: `User registration for ${user.name} has been rejected.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error rejecting user.', error: error.message });
  }
};

// @desc    Activate or Deactivate User
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' / 'INACTIVE' / 'ACTIVE'

    const targetStatus = status === 'ACTIVE' || status === 'APPROVED' ? 'APPROVED' : 'INACTIVE';

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    user.status = targetStatus;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Kill active sessions immediately on status change
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.roleName,
      action: targetStatus === 'APPROVED' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      module: 'USER',
      targetId: user._id.toString(),
      details: { targetName: user.name, targetEmail: user.email, newStatus: targetStatus }
    });

    res.status(200).json({
      success: true,
      message: `User ${user.name} account is now ${targetStatus === 'APPROVED' ? 'Active' : 'Deactivated'}.`,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error changing user status.', error: error.message });
  }
};

// @desc    Update User Details (Edit User)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, department, designation, roleId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phone) user.phone = phone;
    if (department) user.department = department;
    if (designation) user.designation = designation;

    if (roleId) {
      const role = await Role.findById(roleId);
      if (role) {
        user.role = role._id;
        user.roleName = role.name;
      }
    }

    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.roleName,
      action: 'USER_UPDATED',
      module: 'USER',
      targetId: user._id.toString(),
      details: { updatedUser: user.email, department: user.department }
    });

    res.status(200).json({ success: true, message: 'User profile updated successfully.', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating user details.', error: error.message });
  }
};

// @desc    Delete User Account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Prevent self-deletion of current logged-in Admin
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own logged-in Admin account.' });
    }

    const deletedInfo = { name: user.name, email: user.email, role: user.roleName };
    await User.findByIdAndDelete(id);

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.roleName,
      action: 'USER_DELETED',
      module: 'USER',
      targetId: id,
      details: deletedInfo
    });

    res.status(200).json({ success: true, message: `User account for ${deletedInfo.name} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting user account.', error: error.message });
  }
};

// @desc    Get Audit Logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
exports.getAuditLogs = async (req, res) => {
  try {
    const { module, action, search, page = 1, limit = 30 } = req.query;

    const query = {};

    if (module && module !== 'ALL') {
      query.module = module;
    }

    if (action && action !== 'ALL') {
      query.action = action;
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { targetId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching audit logs.', error: error.message });
  }
};

// @desc    Admin Explicit Override to Close Gate Pass
// @route   POST /api/admin/gate-passes/:id/force-close
// @access  Private (Admin)
exports.forceCloseGatePass = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Admin manual override closure' } = req.body;

    const gatePass = await GatePass.findById(id);
    if (!gatePass) {
      return res.status(404).json({ success: false, message: 'Gate pass record not found.' });
    }

    gatePass.status = 'closed';
    gatePass.gatePassStatus = 'CLOSED';
    gatePass.returnStatus = 'FULLY_RETURNED';
    await gatePass.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.roleName,
      action: 'GATE_PASS_FORCE_CLOSED',
      module: 'GATE_PASS',
      targetId: gatePass._id.toString(),
      details: { gatePassNumber: gatePass.gatePassNumber, companyName: gatePass.companyName, reason }
    });

    res.status(200).json({
      success: true,
      message: `Gate Pass ${gatePass.gatePassNumber} has been officially closed by Admin override.`,
      gatePass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error closing gate pass.', error: error.message });
  }
};
