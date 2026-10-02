const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find({}).sort({ createdAt: 1 });
    res.status(200).json({ success: true, roles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching roles.', error: error.message });
  }
};

// @desc    Create new custom role
// @route   POST /api/roles
// @access  Private (Admin)
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'Role name and permissions list are required.' });
    }

    const code = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const existingRole = await Role.findOne({ $or: [{ name }, { code }] });
    if (existingRole) {
      return res.status(400).json({ success: false, message: 'A role with this name already exists.' });
    }

    const role = await Role.create({
      name,
      code,
      description,
      permissions,
      isSystemRole: false,
      status: 'ACTIVE'
    });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.roleName,
      action: 'ROLE_CREATED',
      module: 'ROLE',
      targetId: role._id.toString(),
      details: { roleName: role.name, permissionsCount: permissions.length }
    });

    res.status(201).json({ success: true, message: `Role '${role.name}' created successfully.`, role });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating role.', error: error.message });
  }
};

// @desc    Update role permissions
// @route   PUT /api/roles/:id
// @access  Private (Admin)
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    if (role.isSystemRole && role.code === 'admin' && permissions) {
      // Admin system role must retain full admin_access
      if (!permissions.includes('admin_access')) {
        permissions.push('admin_access');
      }
    }

    if (name && !role.isSystemRole) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions && Array.isArray(permissions)) role.permissions = permissions;

    await role.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.roleName,
      action: 'ROLE_UPDATED',
      module: 'ROLE',
      targetId: role._id.toString(),
      details: { roleName: role.name, permissionsCount: role.permissions.length }
    });

    res.status(200).json({ success: true, message: `Role '${role.name}' updated successfully.`, role });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating role.', error: error.message });
  }
};

// @desc    Delete custom role
// @route   DELETE /api/roles/:id
// @access  Private (Admin)
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    if (role.isSystemRole) {
      return res.status(400).json({ success: false, message: 'System roles cannot be deleted.' });
    }

    await Role.findByIdAndDelete(id);

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.roleName,
      action: 'ROLE_DELETED',
      module: 'ROLE',
      targetId: id,
      details: { roleName: role.name }
    });

    res.status(200).json({ success: true, message: `Role '${role.name}' deleted successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting role.', error: error.message });
  }
};
