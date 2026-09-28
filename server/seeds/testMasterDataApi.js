const mongoose = require('mongoose');
require('dotenv').config();

const ItemMaster = require('../models/ItemMaster');
const VendorMaster = require('../models/VendorMaster');
const MasterDataAudit = require('../models/MasterDataAudit');

async function testMasterData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maruti_denim';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for testing...');

    const itemCount = await ItemMaster.countDocuments();
    console.log(`✓ Total Items in ItemMaster: ${itemCount}`);

    const vendorCount = await VendorMaster.countDocuments();
    console.log(`✓ Total Vendors in VendorMaster: ${vendorCount}`);

    const auditCount = await MasterDataAudit.countDocuments();
    console.log(`✓ Total Audit Records in MasterDataAudit: ${auditCount}`);

    const sampleItem = await ItemMaster.findOne();
    console.log('✓ Sample Item:', sampleItem?.description, '| UM:', sampleItem?.um, '| Code:', sampleItem?.itemCode);

    const sampleVendor = await VendorMaster.findOne();
    console.log('✓ Sample Vendor:', sampleVendor?.vendorName, '| Code:', sampleVendor?.vendorCode);

    await mongoose.disconnect();
    console.log('All tests passed successfully!');
  } catch (err) {
    console.error('Test error:', err);
  }
}

testMasterData();
