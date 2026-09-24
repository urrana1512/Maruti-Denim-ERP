const puppeteer = require('puppeteer');

let browserInstance = null;

const getBrowser = async () => {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
  }
  return browserInstance;
};

/**
 * Generate PDF buffer from a URL via Puppeteer
 */
const generatePdfFromUrl = async (url) => {
  let page = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Emulate A4 media type
    await page.emulateMediaType('print');

    // Navigate to document print view
    await page.goto(url, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000
    });

    // Wait for document ready attribute or fallback timeout
    try {
      await page.waitForSelector('[data-ready="true"]', { timeout: 8000 });
    } catch (e) {
      console.warn('PDF Generator: data-ready selector timeout, proceeding with render');
    }

    // Wait for fonts to load
    await page.evaluate(() => document.fonts ? document.fonts.ready : Promise.resolve());

    // Generate PDF with A4 paper format and CSS page rules
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Puppeteer PDF Generation Failed:', error);
    throw error;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
};

module.exports = {
  generatePdfFromUrl
};
