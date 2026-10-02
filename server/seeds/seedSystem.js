const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Role = require('../models/Role');
const User = require('../models/User');
const ItemMaster = require('../models/ItemMaster');
const VendorMaster = require('../models/VendorMaster');
const AuditLog = require('../models/AuditLog');

const ALL_PERMISSIONS = [
  'admin_access',
  'user_management',
  'rbac_management',
  'gate_pass_read',
  'gate_pass_create',
  'gate_pass_update',
  'gate_pass_delete',
  'gate_pass_approve',
  'gate_pass_close',
  'material_inward_read',
  'material_inward_create',
  'material_inward_delete',
  'master_data_read',
  'master_data_manage',
  'reports_view',
  'reports_export'
];

const DEFAULT_ROLES = [
  {
    name: 'Admin',
    code: 'admin',
    description: 'Full enterprise access to all modules, RBAC, user management, and audit logs',
    permissions: ALL_PERMISSIONS,
    isSystemRole: true,
    status: 'ACTIVE'
  },
  {
    name: 'Purchase Manager',
    code: 'purchase_manager',
    description: 'Manages gate passes, vendors, items, and department reports',
    permissions: [
      'gate_pass_read',
      'gate_pass_create',
      'gate_pass_update',
      'gate_pass_approve',
      'master_data_read',
      'master_data_manage',
      'reports_view',
      'reports_export'
    ],
    isSystemRole: true,
    status: 'ACTIVE'
  },
  {
    name: 'Store Manager',
    code: 'store_manager',
    description: 'Full control over gate passes and material inward receipts',
    permissions: [
      'gate_pass_read',
      'gate_pass_create',
      'gate_pass_update',
      'gate_pass_approve',
      'gate_pass_close',
      'material_inward_read',
      'material_inward_create',
      'master_data_read',
      'reports_view',
      'reports_export'
    ],
    isSystemRole: true,
    status: 'ACTIVE'
  },
  {
    name: 'Store Executive',
    code: 'store_executive',
    description: 'Processes material inward receipts and views gate pass status',
    permissions: [
      'gate_pass_read',
      'material_inward_read',
      'material_inward_create',
      'master_data_read',
      'reports_view'
    ],
    isSystemRole: true,
    status: 'ACTIVE'
  },
  {
    name: 'Department Staff',
    code: 'department_staff',
    description: 'Creates and tracks department returnable and non-returnable gate passes',
    permissions: [
      'gate_pass_read',
      'gate_pass_create',
      'master_data_read',
      'reports_view'
    ],
    isSystemRole: true,
    status: 'ACTIVE'
  }
];

const seedSystem = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maruti_denim';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('--- Seeding System Roles & Permissions ---');
    const createdRoles = {};

    for (const roleDef of DEFAULT_ROLES) {
      let role = await Role.findOne({ code: roleDef.code });
      if (!role) {
        role = await Role.create(roleDef);
        console.log(`Created system role: ${role.name}`);
      } else {
        role.permissions = roleDef.permissions;
        role.description = roleDef.description;
        await role.save();
        console.log(`Updated system role: ${role.name}`);
      }
      createdRoles[role.code] = role;
    }

    console.log('--- Seeding Initial Admin Account ---');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@marutidenim.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Maruti2026!';

    let adminUser = await User.findOne({ email: adminEmail }).select('+password');
    if (!adminUser) {
      adminUser = new User({
        name: 'System Administrator',
        email: adminEmail,
        phone: '9876543210',
        department: 'Admin',
        designation: 'System Administrator',
        password: adminPassword,
        role: createdRoles.admin._id,
        roleName: 'Admin',
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: 'System Seed'
      });
      await adminUser.save();
      console.log(`Initial Admin user created: ${adminEmail}`);
    } else {
      adminUser.role = createdRoles.admin._id;
      adminUser.roleName = 'Admin';
      adminUser.status = 'APPROVED';
      await adminUser.save();
      console.log(`Initial Admin user exists and verified: ${adminEmail}`);
    }

    console.log('--- Seeding Item Description Master Data ---');
    const seedFilePath = path.join(__dirname, 'data/itemMaster.seed.json');
    let itemSeedCount = 0;

    if (fs.existsSync(seedFilePath)) {
      const seedItems = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));
      console.log(`Found ${seedItems.length} items in itemMaster.seed.json file.`);

      let existingCount = await ItemMaster.countDocuments();

      for (let i = 0; i < seedItems.length; i++) {
        const item = seedItems[i];
        const description = (item.description || '').trim();
        const um = (item.uom || item.um || 'Nos').trim();

        if (!description) continue;

        const descriptionNormalized = description.toLowerCase().replace(/\s+/g, ' ');
        const existing = await ItemMaster.findOne({ descriptionNormalized, um });

        if (!existing) {
          existingCount++;
          const itemCode = `ITEM-${String(existingCount).padStart(4, '0')}`;
          await ItemMaster.create({
            itemCode,
            description,
            descriptionNormalized,
            um,
            status: 'ACTIVE',
            createdBy: 'System Seed',
            updatedBy: 'System Seed'
          });
          itemSeedCount++;
        }
      }
      console.log(`Successfully seeded ${itemSeedCount} Item Master records into database.`);
    } else {
      console.warn('itemMaster.seed.json file not found at:', seedFilePath);
    }

    // Audit log entry for seeding
    await AuditLog.create({
      userId: adminUser._id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      userRole: adminUser.roleName,
      action: 'SYSTEM_SEED',
      module: 'SYSTEM',
      details: { message: `Database seeded with roles, Admin account, and ${itemSeedCount} item descriptions.` }
    });

    console.log('--- Seed Completed Successfully ---');
    console.log(`Admin Credentials:\nEmail: ${adminEmail}\nPassword: ${adminPassword}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding system:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedSystem();
}

module.exports = seedSystem;
