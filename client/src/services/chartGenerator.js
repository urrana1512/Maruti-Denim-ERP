/**
 * Helper to format numbers nicely for chart labels
 */
const formatChartValue = (val, prefix = '', suffix = '') => {
  if (val === null || val === undefined || isNaN(val)) return `${prefix}0${suffix}`;
  return `${prefix}${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}${suffix}`;
};

/**
 * 1. Donut Chart SVG Builder (Client)
 */
export const buildDonutChartSvg = ({ title, subtitle, items = [], centerText = 'TOTAL', centerSub = '' }) => {
  const width = 680;
  const height = 360;
  const total = items.reduce((acc, it) => acc + (Number(it.value) || 0), 0);

  let currentAngle = 0;
  const cx = 200;
  const cy = 200;
  const r = 80;
  const strokeWidth = 36;
  const circumference = 2 * Math.PI * r;

  const slices = items.map((it) => {
    const val = Number(it.value) || 0;
    const pct = total > 0 ? val / total : 0;
    const dashArray = `${(pct * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
    const dashOffset = (-currentAngle * circumference).toFixed(2);
    currentAngle += pct;
    return { ...it, pct: Math.round(pct * 100), dashArray, dashOffset };
  });

  const legendItemsHtml = items.map((it, idx) => {
    const val = Number(it.value) || 0;
    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
    const yPos = 120 + idx * 36;
    return `
      <g transform="translate(380, ${yPos})">
        <rect x="0" y="0" width="16" height="16" rx="4" fill="${it.color || '#3B82F6'}"/>
        <text x="28" y="13" fill="#F8FAFC" font-size="13" font-weight="600" font-family="'Calibri', 'Segoe UI', sans-serif">${it.label}:</text>
        <text x="240" y="13" fill="${it.color || '#3B82F6'}" font-size="13" font-weight="700" font-family="'Calibri', 'Segoe UI', sans-serif" text-anchor="end">${formatChartValue(val, it.prefix, it.suffix)} (${pct}%)</text>
      </g>
    `;
  }).join('');

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="14" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <text x="30" y="42" fill="#F8FAFC" font-size="16" font-weight="800" font-family="'Calibri', 'Segoe UI', sans-serif">${title.toUpperCase()}</text>
      <text x="30" y="64" fill="#94A3B8" font-size="12" font-family="'Calibri', 'Segoe UI', sans-serif">${subtitle}</text>
      
      <g transform="translate(${cx}, ${cy})">
        ${total === 0 ? `
          <circle r="${r}" cx="0" cy="0" fill="none" stroke="#334155" stroke-width="${strokeWidth}"/>
          <text x="0" y="4" fill="#94A3B8" font-size="13" font-weight="600" font-family="'Calibri', 'Segoe UI', sans-serif" text-anchor="middle">No Data</text>
        ` : slices.map(s => `
          <circle r="${r}" cx="0" cy="0" fill="none" stroke="${s.color}" stroke-width="${strokeWidth}"
                  stroke-dasharray="${s.dashArray}" stroke-dashoffset="${s.dashOffset}"
                  transform="rotate(-90)" stroke-linecap="round"/>
        `).join('')}
        
        <text x="0" y="-4" fill="#F8FAFC" font-size="22" font-weight="800" font-family="'Calibri', 'Segoe UI', sans-serif" text-anchor="middle">${centerText}</text>
        <text x="0" y="18" fill="#94A3B8" font-size="11" font-weight="700" font-family="'Calibri', 'Segoe UI', sans-serif" text-anchor="middle">${centerSub || 'RECORDS'}</text>
      </g>
      
      ${legendItemsHtml}
    </svg>
  `;
  return svg;
};

/**
 * 2. Bar Chart SVG Builder (Client)
 */
export const buildBarChartSvg = ({ title, subtitle, items = [], valuePrefix = '', valueSuffix = '' }) => {
  const width = 680;
  const height = 360;
  const maxVal = Math.max(...items.map(it => Number(it.value) || 0), 1);

  const barHeight = 28;
  const startY = 100;
  const maxBarWidth = 320;

  const barsHtml = items.slice(0, 6).map((it, idx) => {
    const val = Number(it.value) || 0;
    const barW = Math.max(8, Math.round((val / maxVal) * maxBarWidth));
    const yPos = startY + idx * 42;
    const color = it.color || (idx % 2 === 0 ? '#3B82F6' : '#10B981');
    const labelTrunc = (it.label || 'Item').length > 22 ? (it.label || 'Item').substring(0, 20) + '...' : (it.label || 'Item');

    return `
      <g transform="translate(30, ${yPos})">
        <text x="0" y="18" fill="#E2E8F0" font-size="12" font-weight="600" font-family="'Calibri', 'Segoe UI', sans-serif">${labelTrunc}</text>
        <rect x="180" y="2" width="${maxBarWidth}" height="${barHeight}" rx="6" fill="#1E293B"/>
        <rect x="180" y="2" width="${barW}" height="${barHeight}" rx="6" fill="${color}"/>
        <text x="${190 + barW}" y="20" fill="#F8FAFC" font-size="12" font-weight="700" font-family="'Calibri', 'Segoe UI', sans-serif">${formatChartValue(val, valuePrefix, valueSuffix)}</text>
      </g>
    `;
  }).join('');

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="14" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <text x="30" y="42" fill="#F8FAFC" font-size="16" font-weight="800" font-family="'Calibri', 'Segoe UI', sans-serif">${title.toUpperCase()}</text>
      <text x="30" y="64" fill="#94A3B8" font-size="12" font-family="'Calibri', 'Segoe UI', sans-serif">${subtitle}</text>
      
      ${items.length === 0 ? `
        <text x="340" y="200" fill="#94A3B8" font-size="14" font-weight="600" font-family="'Calibri', 'Segoe UI', sans-serif" text-anchor="middle">No Data Available</text>
      ` : barsHtml}
    </svg>
  `;
  return svg;
};

/**
 * Convert SVG string to PNG Base64 string in Browser HTML5 Canvas
 */
export const svgToPngBase64 = (svgString, width = 680, height = 360) => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * 2; // HiDPI
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        const base64 = canvas.toDataURL('image/png').split(',')[1];
        resolve(base64);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch (err) {
      console.error('Failed to convert SVG to PNG in browser:', err);
      resolve(null);
    }
  });
};
