const puppeteer = require('puppeteer');
const fs = require('fs');

async function renderSvgToPng(svgString, width = 650, height = 340) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: transparent; overflow: hidden; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
        </style>
      </head>
      <body>
        ${svgString}
      </body>
    </html>
  `;
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  const element = await page.$('svg');
  const buffer = await element.screenshot({ type: 'png', omitBackground: true });
  await browser.close();
  return buffer;
}

const sampleSvg = `
<svg width="650" height="340" viewBox="0 0 650 340" xmlns="http://www.w3.org/2000/svg">
  <rect width="650" height="340" rx="12" fill="#0F172A"/>
  <text x="30" y="40" fill="#F8FAFC" font-size="16" font-weight="700">GATE PASS STATUS DISTRIBUTION</text>
  <text x="30" y="62" fill="#94A3B8" font-size="12">Breakdown of issued gate passes by operational state</text>
  
  <g transform="translate(180, 195)">
    <!-- Donut Segments -->
    <circle r="75" cx="0" cy="0" fill="none" stroke="#10B981" stroke-width="32" stroke-dasharray="330 140" stroke-dashoffset="0"/>
    <circle r="75" cx="0" cy="0" fill="none" stroke="#F59E0B" stroke-width="32" stroke-dasharray="100 370" stroke-dashoffset="-330"/>
    <circle r="75" cx="0" cy="0" fill="none" stroke="#EF4444" stroke-width="32" stroke-dasharray="40 430" stroke-dashoffset="-430"/>
    <text x="0" y="-5" fill="#F8FAFC" font-size="22" font-weight="800" text-anchor="middle">100%</text>
    <text x="0" y="18" fill="#94A3B8" font-size="11" font-weight="600" text-anchor="middle">CLEARED</text>
  </g>
  
  <g transform="translate(380, 120)">
    <rect x="0" y="0" width="16" height="16" rx="4" fill="#10B981"/>
    <text x="28" y="13" fill="#E2E8F0" font-size="13" font-weight="600">Closed / Returned (75%)</text>
    
    <rect x="0" y="36" width="16" height="16" rx="4" fill="#F59E0B"/>
    <text x="28" y="49" fill="#E2E8F0" font-size="13" font-weight="600">Open / Active (20%)</text>
    
    <rect x="0" y="72" width="16" height="16" rx="4" fill="#EF4444"/>
    <text x="28" y="85" fill="#E2E8F0" font-size="13" font-weight="600">Cancelled / Overdue (5%)</text>
  </g>
</svg>
`;

renderSvgToPng(sampleSvg).then(buf => {
  fs.writeFileSync('scratch/sample_chart.png', buf);
  console.log('Successfully saved scratch/sample_chart.png, length:', buf.length);
}).catch(err => {
  console.error('Error rendering chart:', err);
});
