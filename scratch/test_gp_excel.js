const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Connect to MongoDB
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const GatePass = require('../server/models/GatePass');
const reportService = require('../server/services/reportService');
const excelService = require('../server/services/excelService');

async function testExport() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/maruti_denim');
  console.log('MongoDB Connected.');

  const reportData = await reportService.getGatePassRegisterReport({});
  console.log(`Found ${reportData.records.length} gate pass records.`);
  
  if (reportData.records.length > 0) {
    console.log('Sample record createdBy:', reportData.records[0].createdBy);
    console.log('Sample record items count:', reportData.records[0].items ? reportData.records[0].items.length : 0);
  }

  const buffer = await excelService.generateReportExcel({
    reportType: 'gate-pass',
    reportTitle: 'Gate Pass Register Report',
    filters: {},
    records: reportData.records || [],
    kpis: reportData.kpis || {}
  });

  const outPath = path.join(__dirname, 'test_gate_pass_register.xlsx');
  fs.writeFileSync(outPath, buffer);
  console.log('Successfully wrote section-wise Gate Pass Excel to:', outPath);

  await mongoose.disconnect();
}

testExport().catch(err => {
  console.error('Test Error:', err);
  process.exit(1);
});
