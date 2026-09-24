const { generatePdfFromUrl } = require('../server/services/pdfService');

async function test() {
  try {
    console.log('Testing Puppeteer PDF generation...');
    const url = 'http://localhost:5173/documents/material-inward/test/print';
    const pdfBuffer = await generatePdfFromUrl(url);
    console.log('PDF Buffer generated, length:', pdfBuffer.length);
  } catch (err) {
    console.error('PDF Test Error:', err);
  }
}

test();
