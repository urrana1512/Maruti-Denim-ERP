const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const reportService = require('../server/services/reportService');

async function testCombinedFix() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/maruti_denim');
  console.log('MongoDB Connected.');

  const res = await reportService.getCombinedReport({});
  console.log(`Found ${res.records.length} records in Combined Report.`);

  res.records.forEach((r, idx) => {
    console.log(`[Row ${idx + 1}] GP: ${r.gatePassNumber} | Item: ${r.itemDescription} | Inward No: ${r.inwardNumber} | Rec Qty: ${r.receivedQuantity} | Rate: ${r.rate} | Taxable: ${r.taxableAmount} | GST%: ${r.gstPercentage}% | GST: ${r.gstAmount} | Grand Total: ${r.grandTotal}`);
  });

  await mongoose.disconnect();
}

testCombinedFix().catch(err => {
  console.error(err);
  process.exit(1);
});
