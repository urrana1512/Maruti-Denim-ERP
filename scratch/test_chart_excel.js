const fs = require('fs');
const path = require('path');
const { generateReportExcel } = require('../server/services/excelService');

async function testChartExport() {
  console.log('Testing Excel chart generation...');

  const sampleRecords = [
    {
      gatePassNumber: 'GP-2026-0001',
      date: new Date(),
      companyName: 'Apex Textiles Ltd',
      vendorAddress: 'GIDC Industrial Area, Surat, Gujarat',
      vendorGstin: '24AAACA1234A1Z5',
      purpose: 'Machine Servicing & Overhaul',
      passType: 'Returnable',
      materialType: 'Returnable',
      totalQuantity: 50,
      returnableQuantity: 50,
      returnedQuantity: 30,
      balanceReturnableQuantity: 20,
      pendingQuantity: 20,
      daysPending: 12,
      rate: 1500,
      taxableAmount: 75000,
      gstPercentage: 18,
      gstAmount: 13500,
      grandTotal: 88500,
      gatePassStatus: 'OPEN',
      returnStatus: 'PARTIALLY_RETURNED',
      remarks: '20 units pending return from vendor'
    },
    {
      gatePassNumber: 'GP-2026-0002',
      date: new Date(),
      companyName: 'Reliance Dyeing Works',
      vendorAddress: 'Kadodara Char Rasta, Surat',
      vendorGstin: '24BBBCC5678B1Z2',
      purpose: 'Dyeing Processing Sample',
      passType: 'Returnable',
      materialType: 'Returnable',
      totalQuantity: 100,
      returnableQuantity: 100,
      returnedQuantity: 100,
      balanceReturnableQuantity: 0,
      pendingQuantity: 0,
      daysPending: 0,
      rate: 450,
      taxableAmount: 45000,
      gstPercentage: 18,
      gstAmount: 8100,
      grandTotal: 53100,
      gatePassStatus: 'CLOSED',
      returnStatus: 'FULLY_RETURNED',
      remarks: 'All items returned and verified'
    }
  ];

  try {
    const buffer = await generateReportExcel({
      reportType: 'gate-pass',
      reportTitle: 'Gate Pass Register Report with Visual Dashboard',
      filters: { fromDate: '2026-10-01', toDate: '2026-10-02' },
      records: sampleRecords,
      kpis: { totalGatePasses: 2, totalReturnableQuantity: 150, totalReturnedQuantity: 130 }
    });

    const outPath = path.join(__dirname, 'test_output_with_charts.xlsx');
    fs.writeFileSync(outPath, buffer);
    console.log('SUCCESS! Generated test Excel with charts at:', outPath);
  } catch (err) {
    console.error('ERROR generating Excel with charts:', err);
  }
}

testChartExport();
