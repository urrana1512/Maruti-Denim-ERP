const mongoose = require('mongoose');
const reportService = require('./services/reportService');
const excelService = require('./services/excelService');
const fs = require('fs');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/maruti_denim_db');
  console.log('Connected to MongoDB');

  const result = await reportService.getGatePassClosureReport({});
  console.log('Closure Records Count:', result.records.length);

  if (result.records.length > 0) {
    const rec = result.records[0];
    console.log('First Record Gate Pass:', rec.gatePassNumber);
    console.log('Items Count:', rec.items ? rec.items.length : 0);
    console.log('Items Sample:', JSON.stringify(rec.items, null, 2));
    console.log('Inwards Count:', rec.inwards ? rec.inwards.length : 0);
    console.log('Inwards Sample:', JSON.stringify(rec.inwards, null, 2));
  }

  const buf = await excelService.generateReportExcel({
    reportType: 'gate-pass-closure',
    reportTitle: 'Gate Pass Closure Report',
    filters: {},
    records: result.records,
    kpis: result.kpis
  });

  fs.writeFileSync('../scratch/test_closure_export.xlsx', buf);
  console.log('Saved scratch/test_closure_export.xlsx with size:', buf.length);
  await mongoose.disconnect();
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
