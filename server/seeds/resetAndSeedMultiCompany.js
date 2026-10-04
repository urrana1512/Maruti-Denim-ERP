const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const {
  getSuperAdminConnection,
  getSuperAdminModels,
  getTenantConnection,
  getTenantModels
} = require('../config/connectionManager');

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

const COMPANIES_SEED = [
  {
    code: 'maruti_nandan',
    name: 'MARUTI NANDAN DENIM PVT LTD',
    address: 'Ahmedabad, Gujarat',
    gstNo: '24AAACM1234F1Z1',
    dbName: 'maruti_nandan_db',
    adminEmail: 'admin@marutidenim.com',
    adminName: 'Maruti Nandan Admin',
    adminPassword: 'Admin@123'
  },
  {
    code: 'shri_ram',
    name: 'SHRI RAM COT FAB',
    address: '84, Devraj Industrial Park, Piplaj Pirana Road, Ahmedabad - 382405.',
    gstNo: '24ACTFS8487N1ZV',
    dbName: 'shri_ram_cot_fab_db',
    adminEmail: 'admin@shriramcotfab.com',
    adminName: 'Shri Ram Admin',
    adminPassword: 'Admin@123'
  },
  {
    code: 'balaji_polycot',
    name: 'BALAJI POLYCOT PVT. LTD.',
    address: '82, Devraj Industrial Park, Piplaj Pirana Road, Ahmedabad - 382405.',
    gstNo: '24AAECB8723G1ZT',
    dbName: 'balaji_polycot_db',
    adminEmail: 'admin@balajipolycot.com',
    adminName: 'Balaji Polycot Admin',
    adminPassword: 'Admin@123'
  }
];

async function resetAndSeedMultiCompanySystem() {
  try {
    console.log('=================================================================');
    console.log('🚀 MULTI-COMPANY SYSTEM DATABASE RESET & SEEDING PROCESS');
    console.log('=================================================================\n');

    // 1. Provision Super Admin Database
    console.log('--- 1. Provisioning Super Admin Database (gatepass_superadmin_db) ---');
    const { Company, SuperAdminUser, SuperAdminAuditLog } = getSuperAdminModels();
    
    // Seed Super Admin Account
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@marutidenim.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

    let superAdmin = await SuperAdminUser.findOne({ email: superAdminEmail });
    if (!superAdmin) {
      superAdmin = await SuperAdminUser.create({
        name: 'Platform Super Administrator',
        email: superAdminEmail,
        password: superAdminPassword,
        role: 'SUPER_ADMIN'
      });
      console.log(`✓ Super Admin account created: ${superAdminEmail}`);
    } else {
      console.log(`✓ Super Admin account verified: ${superAdminEmail}`);
    }

    // Seed/Reset Company Catalog Records
    for (const cSeed of COMPANIES_SEED) {
      let company = await Company.findOne({ code: cSeed.code });
      if (!company) {
        company = await Company.create({
          name: cSeed.name,
          code: cSeed.code,
          address: cSeed.address,
          gstNo: cSeed.gstNo,
          dbName: cSeed.dbName,
          status: 'ACTIVE',
          adminEmail: cSeed.adminEmail,
          adminName: cSeed.adminName,
          logoUrl: '/Maruti%20denim%20logo.png'
        });
        console.log(`✓ Provisioned company catalog record: ${company.name} (${company.code})`);
      } else {
        company.name = cSeed.name;
        company.address = cSeed.address;
        company.gstNo = cSeed.gstNo;
        company.status = 'ACTIVE';
        await company.save();
        console.log(`✓ Verified company catalog record: ${company.name} (${company.code})`);
      }
    }

    // 2. Provision & Reset Each Tenant Database
    console.log('\n--- 2. Provisioning & Resetting Tenant Databases ---');

    const seedFilePath = path.join(__dirname, 'data/itemMaster.seed.json');
    let seedItems = [];
    if (fs.existsSync(seedFilePath)) {
      seedItems = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));
    }

    for (const cSeed of COMPANIES_SEED) {
      console.log(`\n📂 Resetting & Seeding Tenant DB: ${cSeed.dbName} (${cSeed.name})...`);
      const tenantModels = getTenantModels(cSeed.code, cSeed.dbName);

      // RESET DATA: Wipe transactional collections while keeping schemas
      const rGatePass = await tenantModels.GatePass.deleteMany({});
      const rMaterialInward = await tenantModels.MaterialInward.deleteMany({});
      const rOtp = await tenantModels.Otp.deleteMany({});
      const rAuditLog = await tenantModels.AuditLog.deleteMany({});
      const rMasterDataAudit = await tenantModels.MasterDataAudit.deleteMany({});
      const rGatePassAudit = await tenantModels.GatePassAudit.deleteMany({});
      const rVendorMaster = await tenantModels.VendorMaster.deleteMany({});
      const rUsers = await tenantModels.User.deleteMany({});

      console.log(`   ✓ Cleared GatePasses: ${rGatePass.deletedCount}`);
      console.log(`   ✓ Cleared MaterialInwards: ${rMaterialInward.deletedCount}`);
      console.log(`   ✓ Cleared User records: ${rUsers.deletedCount}`);
      console.log(`   ✓ Cleared OTPs, Audits, Vendors`);

      // Seed Roles
      const createdRoles = {};
      for (const roleDef of DEFAULT_ROLES) {
        let role = await tenantModels.Role.findOne({ code: roleDef.code });
        if (!role) {
          role = await tenantModels.Role.create(roleDef);
        } else {
          role.permissions = roleDef.permissions;
          await role.save();
        }
        createdRoles[role.code] = role;
      }
      console.log(`   ✓ System Roles verified (${Object.keys(createdRoles).length} roles)`);

      // Seed Initial Company Admin User
      const adminUser = await tenantModels.User.create({
        name: cSeed.adminName,
        email: cSeed.adminEmail,
        phone: '9876543210',
        department: 'Admin',
        designation: 'Company Administrator',
        password: cSeed.adminPassword,
        role: createdRoles.admin._id,
        roleName: 'Admin',
        status: 'APPROVED',
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: 'System Multi-Company Reset'
      });
      console.log(`   ✓ Company Admin user created: ${cSeed.adminEmail} / ${cSeed.adminPassword}`);

      // Seed Item Master Catalog
      if (seedItems.length > 0) {
        await tenantModels.ItemMaster.deleteMany({});
        let itemSeedCount = 0;
        for (let i = 0; i < seedItems.length; i++) {
          const item = seedItems[i];
          const description = (item.description || '').trim();
          const um = (item.uom || item.um || 'Nos').trim();
          if (!description) continue;
          const descriptionNormalized = description.toLowerCase().replace(/\s+/g, ' ');
          itemSeedCount++;
          await tenantModels.ItemMaster.create({
            itemCode: `ITEM-${String(itemSeedCount).padStart(4, '0')}`,
            description,
            descriptionNormalized,
            um,
            status: 'ACTIVE',
            createdBy: 'System Seed'
          });
        }
        console.log(`   ✓ Seeded ${itemSeedCount} Item Master records`);
      }

      await tenantModels.AuditLog.create({
        userId: adminUser._id,
        userName: adminUser.name,
        userEmail: adminUser.email,
        userRole: 'Admin',
        action: 'MULTI_COMPANY_TENANT_SEED',
        module: 'SYSTEM',
        details: { message: `Tenant database ${cSeed.dbName} reset and seeded successfully.` }
      });
    }

    // Record Super Admin audit log entry
    await SuperAdminAuditLog.create({
      userId: superAdmin._id.toString(),
      userName: superAdmin.name,
      userEmail: superAdmin.email,
      action: 'MULTI_COMPANY_SYSTEM_RESET',
      module: 'PLATFORM',
      details: { message: 'Reset all tenant databases and provisioned Super Admin + 3 Company tenants.' }
    });

    console.log('\n=================================================================');
    console.log('✅ MULTI-COMPANY SYSTEM RESET & SEED COMPLETED SUCCESSFULLY!');
    console.log('=================================================================');
    console.log(`🔑 Super Admin Portal Credentials:`);
    console.log(`   URL      : http://localhost:5173/superadmin/login`);
    console.log(`   Email    : ${superAdminEmail}`);
    console.log(`   Password : ${superAdminPassword}`);
    console.log('\n🏢 Company Admin Credentials:');
    COMPANIES_SEED.forEach(c => {
      console.log(`   - ${c.name} (${c.code}):`);
      console.log(`     Admin Email : ${c.adminEmail}`);
      console.log(`     Password    : ${c.adminPassword}`);
      console.log(`     Database    : ${c.dbName}`);
    });
    console.log('=================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error in multi-company system reset:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  resetAndSeedMultiCompanySystem();
}

module.exports = resetAndSeedMultiCompanySystem;
