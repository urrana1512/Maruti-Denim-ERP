const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const GatePass = require('../models/GatePass');
const MaterialInward = require('../models/MaterialInward');
const GatePassAudit = require('../models/GatePassAudit');
const MasterDataAudit = require('../models/MasterDataAudit');
const ItemMaster = require('../models/ItemMaster');
const VendorMaster = require('../models/VendorMaster');
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');

const resetDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maruti_denim';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('--- Starting Data-Only Reset ---');
    console.log('Clearing existing document data while preserving database schema and indexes...');

    const rGatePass = await GatePass.deleteMany({});
    console.log(`Cleared GatePass documents: ${rGatePass.deletedCount}`);

    const rMaterialInward = await MaterialInward.deleteMany({});
    console.log(`Cleared MaterialInward documents: ${rMaterialInward.deletedCount}`);

    const rGatePassAudit = await GatePassAudit.deleteMany({});
    console.log(`Cleared GatePassAudit documents: ${rGatePassAudit.deletedCount}`);

    const rMasterDataAudit = await MasterDataAudit.deleteMany({});
    console.log(`Cleared MasterDataAudit documents: ${rMasterDataAudit.deletedCount}`);

    const rItemMaster = await ItemMaster.deleteMany({});
    console.log(`Cleared ItemMaster documents: ${rItemMaster.deletedCount}`);

    const rVendorMaster = await VendorMaster.deleteMany({});
    console.log(`Cleared VendorMaster documents: ${rVendorMaster.deletedCount}`);

    const rUser = await User.deleteMany({});
    console.log(`Cleared User documents: ${rUser.deletedCount}`);

    const rRole = await Role.deleteMany({});
    console.log(`Cleared Role documents: ${rRole.deletedCount}`);

    const rAuditLog = await AuditLog.deleteMany({});
    console.log(`Cleared AuditLog documents: ${rAuditLog.deletedCount}`);

    console.log('--- Database Data Reset Completed Successfully ---');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error executing database data reset:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase;
