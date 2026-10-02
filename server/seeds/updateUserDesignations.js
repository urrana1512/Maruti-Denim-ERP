const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const GatePass = require('../models/GatePass');
const MaterialInward = require('../models/MaterialInward');
const VendorMaster = require('../models/VendorMaster');
const ItemMaster = require('../models/ItemMaster');

async function migrateData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maruti_denim';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB. Starting User Name & Designation update...');

    const rajeshUser = await User.findOne({ email: 'rrrana74@gmail.com' });
    const adminUser = await User.findOne({ roleName: 'Admin' });

    const defaultName = rajeshUser ? rajeshUser.name : (adminUser ? adminUser.name : 'Rajesh Rana');
    const defaultDesignation = rajeshUser ? rajeshUser.designation : (adminUser ? adminUser.designation : 'Purchase Manager');

    console.log(`Setting default creator to: ${defaultName} (${defaultDesignation})`);

    // 1. Update GatePasses
    const gpRes = await GatePass.updateMany(
      {
        $or: [
          { createdBy: 'Admin' },
          { createdBy: 'System' },
          { createdBy: 'Authorized Staff' },
          { createdByDesignation: '' },
          { createdByDesignation: { $exists: false } }
        ]
      },
      {
        $set: {
          createdBy: defaultName,
          createdByDesignation: defaultDesignation
        }
      }
    );
    console.log(`Updated GatePasses: ${gpRes.modifiedCount}`);

    // 2. Update MaterialInwards
    const miRes = await MaterialInward.updateMany(
      {
        $or: [
          { createdBy: 'Admin' },
          { createdBy: 'System' },
          { createdBy: 'Store Incharge' },
          { createdByDesignation: '' },
          { createdByDesignation: { $exists: false } }
        ]
      },
      {
        $set: {
          createdBy: defaultName,
          createdByDesignation: defaultDesignation
        }
      }
    );
    console.log(`Updated MaterialInwards: ${miRes.modifiedCount}`);

    // 3. Update Vendors
    const vendorRes = await VendorMaster.updateMany(
      {
        $or: [
          { createdBy: 'Admin' },
          { createdBy: 'System (Backfill)' },
          { createdByDesignation: '' },
          { createdByDesignation: { $exists: false } }
        ]
      },
      {
        $set: {
          createdBy: defaultName,
          createdByDesignation: defaultDesignation,
          updatedBy: defaultName,
          updatedByDesignation: defaultDesignation
        }
      }
    );
    console.log(`Updated VendorMaster: ${vendorRes.modifiedCount}`);

    // 4. Update Items
    const itemRes = await ItemMaster.updateMany(
      {
        $or: [
          { createdBy: 'Admin' },
          { createdBy: 'System (Seed)' },
          { createdByDesignation: '' },
          { createdByDesignation: { $exists: false } }
        ]
      },
      {
        $set: {
          createdBy: defaultName,
          createdByDesignation: defaultDesignation,
          updatedBy: defaultName,
          updatedByDesignation: defaultDesignation
        }
      }
    );
    console.log(`Updated ItemMaster: ${itemRes.modifiedCount}`);

    console.log('Migration completed successfully!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateData();
