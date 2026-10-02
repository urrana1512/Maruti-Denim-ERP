const ExcelJS = require('exceljs');
const { format } = require('date-fns');

/**
 * Format date nicely for Excel & Summary
 */
const formatDate = (dateVal, withTime = false) => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    return format(d, withTime ? 'dd-MM-yyyy HH:mm' : 'dd-MM-yyyy');
  } catch (err) {
    return '-';
  }
};

/**
 * Helper: Apply colored status badge to an Excel cell
 */
const applyStatusBadge = (cell, statusVal) => {
  const status = String(statusVal || '').toUpperCase().trim();
  cell.value = status;
  cell.alignment = { horizontal: 'center', vertical: 'middle' };

  if (['CLOSED', 'FULLY_RETURNED', 'APPROVED', 'ACTIVE'].includes(status)) {
    // Soft Emerald Green Badge
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF065F46' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
  } else if (['OPEN', 'PARTIALLY_RETURNED', 'PENDING_APPROVAL'].includes(status)) {
    // Soft Amber Badge
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF92400E' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
  } else if (['PENDING'].includes(status)) {
    // Soft Orange Badge
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF9A3412' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
  } else if (['CANCELLED', 'NOT_APPLICABLE', 'INACTIVE'].includes(status)) {
    // Soft Slate Gray Badge
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF475569' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  } else {
    // Default Neutral
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E293B' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  }
};

/**
 * Build Section-Wise Gate Pass Register Worksheet
 */
const buildSectionWiseGatePassSheet = (workbook, reportTitle, records = []) => {
  const dataSheet = workbook.addWorksheet('Gate Pass Register', {
    views: [{ showGridLines: true }]
  });

  // 13 Column Layout (A to M)
  const columnsConfig = [
    { key: 'colA', width: 16 }, // Field Label / Sr
    { key: 'colB', width: 22 }, // GP Value
    { key: 'colC', width: 16 }, // Field Label 2
    { key: 'colD', width: 22 }, // GP Value 2
    { key: 'colE', width: 30 }, // Item Description
    { key: 'colF', width: 16 }, // Category
    { key: 'colG', width: 12 }, // GP Qty
    { key: 'colH', width: 12 }, // Rec/Returned Qty
    { key: 'colI', width: 12 }, // Bal Qty
    { key: 'colJ', width: 10 }, // Unit (UOM)
    { key: 'colK', width: 16 }, // Cost Centre
    { key: 'colL', width: 14 }, // Returnable
    { key: 'colM', width: 24 }  // Remarks
  ];

  dataSheet.columns = columnsConfig.map(c => ({ width: c.width }));

  // Fonts & Fills
  const fontMainTitle = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontSecBanner = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontHeaderLabel = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
  const fontHeaderValue = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };
  const fontTableHead = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontSubtotal = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };

  const fillMainTitle = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
  const fillSecBanner = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const fillLeftHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const fillRightHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  const fillItemHeadLeft = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const fillItemHeadRight = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
  const fillSubtotal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const fillGrandTotal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };

  const borderThin = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };
  const borderDouble = {
    top: { style: 'double', color: { argb: 'FF0F2A47' } },
    bottom: { style: 'double', color: { argb: 'FF0F2A47' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  let currentRow = 1;

  // Sheet Title Banner
  dataSheet.mergeCells(`A${currentRow}:M${currentRow}`);
  const titleCell = dataSheet.getCell(`A${currentRow}`);
  titleCell.value = 'MARUTI NANDAN DENIM PVT LTD — GATE PASS REGISTER (SECTION-WISE REPORT)';
  titleCell.font = fontMainTitle;
  titleCell.fill = fillMainTitle;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dataSheet.getRow(currentRow).height = 28;
  currentRow += 2;

  if (!records || records.length === 0) {
    dataSheet.addRow(['No Gate Pass records found for the selected filter criteria.']).font = { italic: true };
    return;
  }

  let grandTotalGpQty = 0;
  let grandTotalRecQty = 0;
  let grandTotalBalQty = 0;

  records.forEach((rec, idx) => {
    const sectionNum = idx + 1;
    const items = rec.items && rec.items.length > 0 ? rec.items : [
      {
        description: rec.purpose || rec.remarks || 'Gate Pass Material',
        category: 'OCR',
        quantity: rec.totalQuantity || 0,
        receivedQuantity: rec.returnedQuantity || 0,
        balanceQuantity: rec.balanceReturnableQuantity || 0,
        unit: 'Nos',
        costCentre: rec.costCentre || '-',
        returnable: rec.materialType !== 'Non-Returnable',
        remarks: rec.remarks || '-'
      }
    ];

    const gpNo = rec.gatePassNumber || '-';
    const partyName = rec.companyName || rec.partyName || '-';
    const createdByStr = rec.createdBy || 'System Staff';

    // Section Banner Row
    dataSheet.mergeCells(`A${currentRow}:M${currentRow}`);
    const bannerCell = dataSheet.getCell(`A${currentRow}`);
    bannerCell.value = `SECTION #${sectionNum} | GATE PASS NO: ${gpNo} | DATE: ${formatDate(rec.date)} | PARTY: ${partyName.toUpperCase()}`;
    bannerCell.font = fontSecBanner;
    bannerCell.fill = fillSecBanner;
    bannerCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    dataSheet.getRow(currentRow).height = 24;
    currentRow++;

    // Row 1: GP No & GP Date | Pass Type & Department
    dataSheet.getCell(`A${currentRow}`).value = 'Gate Pass No.:';
    dataSheet.getCell(`B${currentRow}`).value = gpNo;
    dataSheet.getCell(`C${currentRow}`).value = 'GP Date:';
    dataSheet.getCell(`D${currentRow}`).value = formatDate(rec.date);

    dataSheet.getCell(`E${currentRow}`).value = 'Pass Type:';
    dataSheet.mergeCells(`F${currentRow}:G${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = rec.materialType || rec.passType || 'Returnable';
    dataSheet.mergeCells(`H${currentRow}:I${currentRow}`);
    dataSheet.getCell(`H${currentRow}`).value = 'Department:';
    dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
    dataSheet.getCell(`J${currentRow}`).value = rec.department || 'GENERAL';

    ['A', 'C'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillLeftHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['B', 'D'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['E', 'H'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillRightHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['F', 'J'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 2: Party & GSTIN | Vendor Address & Vehicle/Driver
    dataSheet.getCell(`A${currentRow}`).value = 'Party / Vendor:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = `${partyName} ${rec.vendorGstin ? '(GSTIN: ' + rec.vendorGstin + ')' : ''}`;

    dataSheet.getCell(`E${currentRow}`).value = 'Vendor Address:';
    dataSheet.mergeCells(`F${currentRow}:G${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = rec.vendorAddress || 'Not specified';
    dataSheet.mergeCells(`H${currentRow}:I${currentRow}`);
    dataSheet.getCell(`H${currentRow}`).value = 'Vehicle / Driver:';
    dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
    dataSheet.getCell(`J${currentRow}`).value = `${rec.vehicleNumber || '-'} ${rec.driverName ? ' / Driver: ' + rec.driverName : ''}`;

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    ['E', 'H'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillRightHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['F', 'J'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 3: Purpose | Created By & GP Status
    dataSheet.getCell(`A${currentRow}`).value = 'Purpose:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = rec.purpose || '-';

    dataSheet.getCell(`E${currentRow}`).value = 'Created By:';
    dataSheet.mergeCells(`F${currentRow}:G${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = createdByStr;

    dataSheet.mergeCells(`H${currentRow}:I${currentRow}`);
    dataSheet.getCell(`H${currentRow}`).value = 'GP Status:';
    dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
    const statusStr = `${rec.gatePassStatus || 'OPEN'} | Approval: ${rec.approvalStatus || 'Pending'} | Return: ${rec.returnStatus || 'PENDING'}`;
    dataSheet.getCell(`J${currentRow}`).value = statusStr;

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    ['E', 'H'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillRightHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['F', 'J'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 4: Items Table Header
    dataSheet.mergeCells(`A${currentRow}:D${currentRow}`);
    dataSheet.getCell(`A${currentRow}`).value = 'GATE PASS ITEMS SPECIFICATION';
    dataSheet.getCell(`A${currentRow}`).font = fontTableHead;
    dataSheet.getCell(`A${currentRow}`).fill = fillItemHeadLeft;
    dataSheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    const itemHeaders = [
      { col: 'E', title: 'Item Description', align: 'left' },
      { col: 'F', title: 'Category', align: 'center' },
      { col: 'G', title: 'GP Qty', align: 'right' },
      { col: 'H', title: 'Rec. Qty', align: 'right' },
      { col: 'I', title: 'Bal. Qty', align: 'right' },
      { col: 'J', title: 'Unit', align: 'center' },
      { col: 'K', title: 'Cost Centre', align: 'left' },
      { col: 'L', title: 'Returnable', align: 'center' },
      { col: 'M', title: 'Remarks', align: 'left' }
    ];

    itemHeaders.forEach(h => {
      const cell = dataSheet.getCell(`${h.col}${currentRow}`);
      cell.value = h.title;
      cell.font = fontTableHead;
      cell.fill = fillItemHeadRight;
      cell.alignment = { horizontal: h.align, vertical: 'middle' };
      cell.border = borderThin;
    });
    dataSheet.getRow(currentRow).height = 22;
    currentRow++;

    // Data Rows for Items
    let secGpQty = 0;
    let secRecQty = 0;
    let secBalQty = 0;

    items.forEach((it, itemIdx) => {
      dataSheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const itemLabel = dataSheet.getCell(`A${currentRow}`);
      itemLabel.value = `Item #${itemIdx + 1}`;
      itemLabel.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
      itemLabel.alignment = { horizontal: 'center', vertical: 'middle' };
      itemLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
      itemLabel.border = borderThin;

      const q = Number(it.quantity) || 0;
      const r = Number(it.receivedQuantity) || Number(it.returnedQuantity) || 0;
      const b = Math.max(0, q - r);

      secGpQty += q;
      secRecQty += r;
      secBalQty += b;

      dataSheet.getCell(`E${currentRow}`).value = it.description || it.itemDescription || '-';
      dataSheet.getCell(`F${currentRow}`).value = it.category || 'OCR';
      dataSheet.getCell(`G${currentRow}`).value = q;
      dataSheet.getCell(`H${currentRow}`).value = r;
      dataSheet.getCell(`I${currentRow}`).value = b;
      dataSheet.getCell(`J${currentRow}`).value = it.unit || it.uom || 'Nos';
      dataSheet.getCell(`K${currentRow}`).value = it.costCentre || '-';
      dataSheet.getCell(`L${currentRow}`).value = it.returnable !== false ? 'Yes' : 'No';
      dataSheet.getCell(`M${currentRow}`).value = it.remarks || '-';

      ['E', 'K', 'M'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' });
      ['F', 'J', 'L'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' });
      ['G', 'H', 'I'].forEach(c => {
        const cell = dataSheet.getCell(`${c}${currentRow}`);
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
      });

      ['E','F','G','H','I','J','K','L','M'].forEach(c => {
        dataSheet.getCell(`${c}${currentRow}`).border = borderThin;
        dataSheet.getCell(`${c}${currentRow}`).font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
      });

      dataSheet.getRow(currentRow).height = 20;
      currentRow++;
    });

    // Subtotal Row for Section
    dataSheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const subLabel = dataSheet.getCell(`A${currentRow}`);
    subLabel.value = `SECTION #${sectionNum} TOTALS (${items.length} Items)`;
    subLabel.font = fontSubtotal;
    subLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
    subLabel.fill = fillSubtotal;

    ['A','B','C','D','E','F'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).border = borderThin);

    dataSheet.getCell(`G${currentRow}`).value = secGpQty;
    dataSheet.getCell(`H${currentRow}`).value = secRecQty;
    dataSheet.getCell(`I${currentRow}`).value = secBalQty;

    ['G', 'H', 'I'].forEach(c => {
      const cell = dataSheet.getCell(`${c}${currentRow}`);
      cell.font = fontSubtotal;
      cell.fill = fillSubtotal;
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '#,##0.00';
      cell.border = borderThin;
    });

    dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
    const subBlank = dataSheet.getCell(`J${currentRow}`);
    subBlank.fill = fillSubtotal;
    ['J','K','L','M'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).border = borderThin);

    dataSheet.getRow(currentRow).height = 22;
    currentRow++;

    grandTotalGpQty += secGpQty;
    grandTotalRecQty += secRecQty;
    grandTotalBalQty += secBalQty;

    currentRow += 1; // Gap between sections
  });

  // Grand Total Summary Block
  dataSheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const gtLabel = dataSheet.getCell(`A${currentRow}`);
  gtLabel.value = `GRAND TOTAL (${records.length} Gate Passes)`;
  gtLabel.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F2A47' } };
  gtLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
  gtLabel.fill = fillGrandTotal;

  ['A','B','C','D','E','F'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).border = borderDouble);

  dataSheet.getCell(`G${currentRow}`).value = grandTotalGpQty;
  dataSheet.getCell(`H${currentRow}`).value = grandTotalRecQty;
  dataSheet.getCell(`I${currentRow}`).value = grandTotalBalQty;

  ['G', 'H', 'I'].forEach(c => {
    const cell = dataSheet.getCell(`${c}${currentRow}`);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F2A47' } };
    cell.fill = fillGrandTotal;
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
    cell.numFmt = '#,##0.00';
    cell.border = borderDouble;
  });

  dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
  const gtBlank = dataSheet.getCell(`J${currentRow}`);
  gtBlank.fill = fillGrandTotal;
  ['J','K','L','M'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).border = borderDouble);

  dataSheet.getRow(currentRow).height = 26;
};

/**
 * Build Section-Wise Material Inward Register Worksheet
 */
const buildSectionWiseInwardSheet = (workbook, reportTitle, records = []) => {
  const dataSheet = workbook.addWorksheet('Inward Register', {
    views: [{ showGridLines: true }]
  });

  // 13 Column Layout (A to M)
  const columnsConfig = [
    { key: 'colA', width: 16 }, // Gate Pass Field / Sr
    { key: 'colB', width: 24 }, // Gate Pass Value
    { key: 'colC', width: 16 }, // Gate Pass Field 2
    { key: 'colD', width: 24 }, // Gate Pass Value 2
    { key: 'colE', width: 30 }, // Item Description
    { key: 'colF', width: 16 }, // Category
    { key: 'colG', width: 12 }, // Orig. Qty
    { key: 'colH', width: 12 }, // Rec. Qty
    { key: 'colI', width: 8 },  // Unit
    { key: 'colJ', width: 13 }, // Rate (₹)
    { key: 'colK', width: 15 }, // Taxable (₹)
    { key: 'colL', width: 18 }, // GST % (Amt ₹)
    { key: 'colM', width: 16 }  // Total Amount (₹)
  ];

  dataSheet.columns = columnsConfig.map(c => ({ width: c.width }));

  // Fonts & Fills
  const fontMainTitle = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontSecBanner = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontHeaderLabel = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
  const fontHeaderValue = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };
  const fontTableHead = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontDataCell = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
  const fontTotalCell = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };

  const fillMainTitle = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
  const fillSecBanner = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const fillLeftHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const fillRightHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  const fillItemHeadLeft = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const fillItemHeadRight = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  const fillSubtotal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const fillGrandTotal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };

  const borderThin = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };
  const borderDouble = {
    top: { style: 'double', color: { argb: 'FF0F2A47' } },
    bottom: { style: 'double', color: { argb: 'FF0F2A47' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  let currentRow = 1;

  // Sheet Title Banner
  dataSheet.mergeCells(`A${currentRow}:M${currentRow}`);
  const titleCell = dataSheet.getCell(`A${currentRow}`);
  titleCell.value = 'MARUTI NANDAN DENIM PVT LTD — MATERIAL INWARD REGISTER (SECTION-WISE REPORT)';
  titleCell.font = fontMainTitle;
  titleCell.fill = fillMainTitle;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dataSheet.getRow(currentRow).height = 28;
  currentRow += 2;

  if (!records || records.length === 0) {
    dataSheet.addRow(['No Material Inward records found for the selected filter criteria.']).font = { italic: true };
    return;
  }

  let grandTotalRecQty = 0;
  let grandTotalTaxable = 0;
  let grandTotalGst = 0;
  let grandTotalAmount = 0;

  records.forEach((rec, idx) => {
    const sectionNum = idx + 1;
    const items = rec.items && rec.items.length > 0 ? rec.items : [
      {
        description: rec.itemDescription || 'Material Item',
        category: 'OCR',
        originalQuantity: rec.originalQuantity || rec.receivedQuantity || 0,
        receivedQuantity: rec.receivedQuantity || 0,
        unit: 'Nos',
        rate: rec.rate || 0,
        taxableAmount: rec.taxableAmount || rec.subtotal || 0,
        gstPercentage: rec.gstPercentage || 18,
        gstAmount: rec.gstAmount || rec.totalGst || 0,
        totalAmount: rec.grandTotal || 0,
        remarks: rec.remarks || '-'
      }
    ];

    const gp = rec.gatePass || {};
    const gpNo = rec.gatePassNumber || gp.gatePassNumber || '-';
    const miNo = rec.inwardNumber || '-';
    const partyName = rec.partyName || gp.companyName || '-';

    // Section Banner Row
    dataSheet.mergeCells(`A${currentRow}:M${currentRow}`);
    const bannerCell = dataSheet.getCell(`A${currentRow}`);
    bannerCell.value = `SECTION #${sectionNum} | GATE PASS NO: ${gpNo} | INWARD NO: ${miNo} | PARTY: ${partyName.toUpperCase()}`;
    bannerCell.font = fontSecBanner;
    bannerCell.fill = fillSecBanner;
    bannerCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    dataSheet.getRow(currentRow).height = 24;
    currentRow++;

    // Row 1: GP No & GP Date | Inward No & Inward Date
    dataSheet.getCell(`A${currentRow}`).value = 'Gate Pass No.:';
    dataSheet.getCell(`B${currentRow}`).value = gpNo;
    dataSheet.getCell(`C${currentRow}`).value = 'GP Date:';
    dataSheet.getCell(`D${currentRow}`).value = formatDate(rec.gatePassDate || gp.date);

    dataSheet.getCell(`E${currentRow}`).value = 'Inward No.:';
    dataSheet.mergeCells(`F${currentRow}:G${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = miNo;
    dataSheet.mergeCells(`H${currentRow}:I${currentRow}`);
    dataSheet.getCell(`H${currentRow}`).value = 'Inward Date:';
    dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
    dataSheet.getCell(`J${currentRow}`).value = formatDate(rec.inwardDate, true);

    ['A', 'C'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillLeftHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['B', 'D'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['E', 'H'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillRightHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['F', 'J'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 2: Party & GSTIN | Gate Entry No & Challan/Inv No
    dataSheet.getCell(`A${currentRow}`).value = 'Party / Vendor:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = `${partyName} ${rec.vendorGstin || gp.vendorGstin ? '(GSTIN: ' + (rec.vendorGstin || gp.vendorGstin) + ')' : ''}`;

    dataSheet.getCell(`E${currentRow}`).value = 'Gate Entry No.:';
    dataSheet.mergeCells(`F${currentRow}:G${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = rec.gateEntryNumber || '-';
    dataSheet.mergeCells(`H${currentRow}:I${currentRow}`);
    dataSheet.getCell(`H${currentRow}`).value = 'Challan / Inv No.:';
    dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
    dataSheet.getCell(`J${currentRow}`).value = rec.challanInvoiceNumber || '-';

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    ['E', 'H'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillRightHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['F', 'J'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 3: Vendor Address | Inward Status & Approved By
    dataSheet.getCell(`A${currentRow}`).value = 'Vendor Address:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = rec.vendorAddress || gp.vendorAddress || 'Not specified';

    dataSheet.getCell(`E${currentRow}`).value = 'Inward Status:';
    dataSheet.mergeCells(`F${currentRow}:G${currentRow}`);
    const miStatusCell = dataSheet.getCell(`F${currentRow}`);
    applyStatusBadge(miStatusCell, rec.status || 'Approved');
    miStatusCell.border = borderThin;

    dataSheet.mergeCells(`H${currentRow}:I${currentRow}`);
    dataSheet.getCell(`H${currentRow}`).value = 'Approved By:';
    dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
    dataSheet.getCell(`J${currentRow}`).value = rec.approvedBy ? `${rec.approvedBy} (${formatDate(rec.approvedAt)})` : (rec.createdBy || 'Admin');

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    ['E', 'H'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillRightHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    dataSheet.getCell(`J${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`J${currentRow}`).border = borderThin;
    dataSheet.getCell(`J${currentRow}`).alignment = { vertical: 'middle' };

    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 4: Pass Type & Purpose | Doc Type & Created By
    dataSheet.getCell(`A${currentRow}`).value = 'Pass Type / Purpose:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = `${gp.passType || 'Returnable'} | Purpose: ${gp.purpose || '-'}`;

    dataSheet.getCell(`E${currentRow}`).value = 'Doc Type:';
    dataSheet.mergeCells(`F${currentRow}:G${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = rec.documentType || 'Challan';
    dataSheet.mergeCells(`H${currentRow}:I${currentRow}`);
    dataSheet.getCell(`H${currentRow}`).value = 'Created By:';
    dataSheet.mergeCells(`J${currentRow}:M${currentRow}`);
    dataSheet.getCell(`J${currentRow}`).value = rec.createdBy || 'Admin';

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    ['E', 'H'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillRightHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['F', 'J'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 5: Vehicle & Driver | Remarks
    dataSheet.getCell(`A${currentRow}`).value = 'Vehicle / Driver:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = `${gp.vehicleNumber || '-'} ${gp.driverName ? ' / Driver: ' + gp.driverName : ''}`;

    dataSheet.getCell(`E${currentRow}`).value = 'Remarks:';
    dataSheet.mergeCells(`F${currentRow}:M${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = rec.remarks || gp.remarks || '-';

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    dataSheet.getCell(`E${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`E${currentRow}`).fill = fillRightHeader;
    dataSheet.getCell(`E${currentRow}`).border = borderThin;
    dataSheet.getCell(`E${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`F${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`F${currentRow}`).border = borderThin;
    dataSheet.getCell(`F${currentRow}`).alignment = { vertical: 'middle' };

    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // 3. Inward Items Table Header
    dataSheet.mergeCells(`A${currentRow}:D${currentRow}`);
    dataSheet.getCell(`A${currentRow}`).value = 'INWARD ITEMS RECEIPT SPECIFICATION';
    dataSheet.getCell(`A${currentRow}`).font = fontTableHead;
    dataSheet.getCell(`A${currentRow}`).fill = fillItemHeadLeft;
    dataSheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    const itemHeaders = [
      { col: 'E', title: 'Item Description', align: 'left' },
      { col: 'F', title: 'Category', align: 'center' },
      { col: 'G', title: 'Orig. Qty', align: 'right' },
      { col: 'H', title: 'Rec. Qty', align: 'right' },
      { col: 'I', title: 'Unit', align: 'center' },
      { col: 'J', title: 'Rate (₹)', align: 'right' },
      { col: 'K', title: 'Taxable (₹)', align: 'right' },
      { col: 'L', title: 'GST % (Amt ₹)', align: 'right' },
      { col: 'M', title: 'Total Amount (₹)', align: 'right' }
    ];

    itemHeaders.forEach(h => {
      const cell = dataSheet.getCell(`${h.col}${currentRow}`);
      cell.value = h.title;
      cell.font = fontTableHead;
      cell.fill = fillItemHeadRight;
      cell.alignment = { horizontal: h.align, vertical: 'middle' };
      cell.border = borderThin;
    });
    dataSheet.getRow(currentRow).height = 22;
    currentRow++;

    // 4. Data Rows for items
    let secRecQty = 0;
    let secTaxable = 0;
    let secGst = 0;
    let secTotal = 0;

    items.forEach((it, itemIdx) => {
      dataSheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const itemLabel = dataSheet.getCell(`A${currentRow}`);
      itemLabel.value = `Item #${itemIdx + 1}`;
      itemLabel.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
      itemLabel.alignment = { horizontal: 'center', vertical: 'middle' };
      itemLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
      itemLabel.border = borderThin;

      const origQty = Number(it.originalQuantity) || Number(it.receivedQuantity) || 0;
      const recQty = Number(it.receivedQuantity) || 0;
      const rateVal = Number(it.rate) || 0;
      const taxableVal = Number(it.taxableAmount) || (recQty * rateVal);
      const gstPct = Number(it.gstPercentage) || 18;
      const gstVal = Number(it.gstAmount) || (taxableVal * (gstPct / 100));
      const totalVal = Number(it.totalAmount) || (taxableVal + gstVal);

      secRecQty += recQty;
      secTaxable += taxableVal;
      secGst += gstVal;
      secTotal += totalVal;

      dataSheet.getCell(`E${currentRow}`).value = it.description || '-';
      dataSheet.getCell(`F${currentRow}`).value = it.category || 'OCR';
      dataSheet.getCell(`G${currentRow}`).value = origQty;
      dataSheet.getCell(`H${currentRow}`).value = recQty;
      dataSheet.getCell(`I${currentRow}`).value = it.unit || it.uom || 'Nos';
      dataSheet.getCell(`J${currentRow}`).value = rateVal;
      dataSheet.getCell(`K${currentRow}`).value = taxableVal;
      dataSheet.getCell(`L${currentRow}`).value = `${gstPct}% (₹${gstVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
      dataSheet.getCell(`M${currentRow}`).value = totalVal;

      ['E', 'F'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).alignment = { horizontal: c === 'F' ? 'center' : 'left', vertical: 'middle' });
      ['G', 'H'].forEach(c => {
        const cell = dataSheet.getCell(`${c}${currentRow}`);
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
      });
      dataSheet.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      ['J', 'K', 'M'].forEach(c => {
        const cell = dataSheet.getCell(`${c}${currentRow}`);
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '"₹" #,##0.00';
      });
      dataSheet.getCell(`L${currentRow}`).alignment = { horizontal: 'right', vertical: 'middle' };

      ['E','F','G','H','I','J','K','L','M'].forEach(c => {
        dataSheet.getCell(`${c}${currentRow}`).font = fontDataCell;
        dataSheet.getCell(`${c}${currentRow}`).border = borderThin;
      });

      dataSheet.getRow(currentRow).height = 20;
      currentRow++;
    });

    grandTotalRecQty += secRecQty;
    grandTotalTaxable += secTaxable;
    grandTotalGst += secGst;
    grandTotalAmount += secTotal;

    // 5. Section Summary Row
    dataSheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const secTotalLabel = dataSheet.getCell(`A${currentRow}`);
    secTotalLabel.value = `SECTION TOTALS (${miNo}):`;
    secTotalLabel.font = fontTotalCell;
    secTotalLabel.alignment = { horizontal: 'right', vertical: 'middle' };
    secTotalLabel.fill = fillSubtotal;
    secTotalLabel.border = borderDouble;

    const cellH = dataSheet.getCell(`H${currentRow}`);
    cellH.value = secRecQty;
    cellH.font = fontTotalCell;
    cellH.alignment = { horizontal: 'right', vertical: 'middle' };
    cellH.numFmt = '#,##0.00';
    cellH.fill = fillSubtotal;
    cellH.border = borderDouble;

    ['I', 'J'].forEach(c => {
      const cell = dataSheet.getCell(`${c}${currentRow}`);
      cell.value = '-'; cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = fillSubtotal; cell.border = borderDouble;
    });

    const cellK = dataSheet.getCell(`K${currentRow}`);
    cellK.value = secTaxable;
    cellK.font = fontTotalCell;
    cellK.alignment = { horizontal: 'right', vertical: 'middle' };
    cellK.numFmt = '"₹" #,##0.00';
    cellK.fill = fillSubtotal;
    cellK.border = borderDouble;

    const cellL = dataSheet.getCell(`L${currentRow}`);
    cellL.value = secGst;
    cellL.font = fontTotalCell;
    cellL.alignment = { horizontal: 'right', vertical: 'middle' };
    cellL.numFmt = '"₹" #,##0.00';
    cellL.fill = fillSubtotal;
    cellL.border = borderDouble;

    const cellM = dataSheet.getCell(`M${currentRow}`);
    cellM.value = secTotal;
    cellM.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };
    cellM.alignment = { horizontal: 'right', vertical: 'middle' };
    cellM.numFmt = '"₹" #,##0.00';
    cellM.fill = fillGrandTotal;
    cellM.border = borderDouble;

    dataSheet.getRow(currentRow).height = 22;
    currentRow += 2; // Blank separator row
  });

  // Grand Summary Banner Row
  dataSheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const grandLabel = dataSheet.getCell(`A${currentRow}`);
  grandLabel.value = `GRAND TOTAL (ALL ${records.length} INWARD SECTIONS):`;
  grandLabel.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  grandLabel.alignment = { horizontal: 'right', vertical: 'middle' };
  grandLabel.fill = fillSecBanner;

  const gCellH = dataSheet.getCell(`H${currentRow}`);
  gCellH.value = grandTotalRecQty;
  gCellH.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  gCellH.alignment = { horizontal: 'right', vertical: 'middle' };
  gCellH.numFmt = '#,##0.00';
  gCellH.fill = fillSecBanner;

  ['I', 'J'].forEach(c => {
    const cell = dataSheet.getCell(`${c}${currentRow}`);
    cell.value = '-'; cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = fillSecBanner;
  });

  const gCellK = dataSheet.getCell(`K${currentRow}`);
  gCellK.value = grandTotalTaxable;
  gCellK.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  gCellK.alignment = { horizontal: 'right', vertical: 'middle' };
  gCellK.numFmt = '"₹" #,##0.00';
  gCellK.fill = fillSecBanner;

  const gCellL = dataSheet.getCell(`L${currentRow}`);
  gCellL.value = grandTotalGst;
  gCellL.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  gCellL.alignment = { horizontal: 'right', vertical: 'middle' };
  gCellL.numFmt = '"₹" #,##0.00';
  gCellL.fill = fillSecBanner;

  const gCellM = dataSheet.getCell(`M${currentRow}`);
  gCellM.value = grandTotalAmount;
  gCellM.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  gCellM.alignment = { horizontal: 'right', vertical: 'middle' };
  gCellM.numFmt = '"₹" #,##0.00';
  gCellM.fill = fillSecBanner;

  dataSheet.getRow(currentRow).height = 25;
};

/**
 * Build Section-Wise Combined Gate Pass & Return Register Worksheet
 */
const buildSectionWiseCombinedSheet = (workbook, reportTitle, records = []) => {
  const dataSheet = workbook.addWorksheet('Combined GP & Return Register', {
    views: [{ showGridLines: true }]
  });

  // 18 Columns Layout (A to R)
  const columnsConfig = [
    { key: 'colA', width: 16 }, // GP Field / Sr
    { key: 'colB', width: 24 }, // GP Val 1
    { key: 'colC', width: 16 }, // GP Field 2
    { key: 'colD', width: 24 }, // GP Val 2
    { key: 'colE', width: 28 }, // Item Description
    { key: 'colF', width: 16 }, // Category
    { key: 'colG', width: 11 }, // Orig Qty
    { key: 'colH', width: 11 }, // Ret Qty
    { key: 'colI', width: 16 }, // Inward No
    { key: 'colJ', width: 14 }, // Inward Date
    { key: 'colK', width: 11 }, // Rec Qty
    { key: 'colL', width: 11 }, // Bal Qty
    { key: 'colM', width: 8 },  // Unit
    { key: 'colN', width: 13 }, // Rate (₹)
    { key: 'colO', width: 15 }, // Taxable (₹)
    { key: 'colP', width: 16 }, // GST % (Amt ₹)
    { key: 'colQ', width: 16 }, // Total Amount (₹)
    { key: 'colR', width: 18 }  // Return Status Badge
  ];

  dataSheet.columns = columnsConfig.map(c => ({ width: c.width }));

  // Fonts & Fills
  const fontMainTitle = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontSecBanner = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontHeaderLabel = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
  const fontHeaderValue = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };
  const fontTableHead = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontDataCell = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
  const fontTotalCell = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F2A47' } };

  const fillMainTitle = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
  const fillSecBanner = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const fillLeftHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const fillRightHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  const fillItemHeadLeft = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const fillItemHeadRight = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  const fillSubtotal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const fillGrandTotal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };

  const borderThin = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };
  const borderDouble = {
    top: { style: 'double', color: { argb: 'FF0F2A47' } },
    bottom: { style: 'double', color: { argb: 'FF0F2A47' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  // Group records by Gate Pass Number
  const sectionsMap = {};
  records.forEach(rec => {
    const gpNo = rec.gatePassNumber || 'UNKNOWN';
    if (!sectionsMap[gpNo]) {
      sectionsMap[gpNo] = {
        gatePassNumber: gpNo,
        date: rec.date,
        partyName: rec.partyName,
        vendorAddress: rec.vendorAddress || '',
        vendorGstin: rec.vendorGstin || '',
        passType: rec.passType || 'Returnable',
        purpose: rec.purpose || '',
        vehicleNumber: rec.vehicleNumber || '',
        driverName: rec.driverName || '',
        department: rec.department || '',
        costCentre: rec.costCentre || '',
        gatePassStatus: rec.gatePassStatus || 'OPEN',
        returnStatus: rec.returnStatus || 'PENDING',
        items: []
      };
    }
    sectionsMap[gpNo].items.push(rec);
  });

  const sections = Object.values(sectionsMap);

  let currentRow = 1;

  // Title Banner
  dataSheet.mergeCells(`A${currentRow}:R${currentRow}`);
  const titleCell = dataSheet.getCell(`A${currentRow}`);
  titleCell.value = 'MARUTI NANDAN DENIM PVT LTD — COMBINED GATE PASS & RETURN REGISTER (SECTION-WISE REPORT)';
  titleCell.font = fontMainTitle;
  titleCell.fill = fillMainTitle;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dataSheet.getRow(currentRow).height = 28;
  currentRow += 2;

  if (!sections || sections.length === 0) {
    dataSheet.addRow(['No Combined Gate Pass & Return records found for the selected filter criteria.']).font = { italic: true };
    return;
  }

  let grandOrigQty = 0;
  let grandRetQty = 0;
  let grandRecQty = 0;
  let grandBalQty = 0;
  let grandTaxable = 0;
  let grandGst = 0;
  let grandAmount = 0;

  sections.forEach((sec, idx) => {
    const sectionNum = idx + 1;
    const gpNo = sec.gatePassNumber;
    const partyName = sec.partyName || '-';

    // Section Banner
    dataSheet.mergeCells(`A${currentRow}:R${currentRow}`);
    const bannerCell = dataSheet.getCell(`A${currentRow}`);
    bannerCell.value = `SECTION #${sectionNum} | GATE PASS NO: ${gpNo} | PARTY: ${partyName.toUpperCase()} | GP DATE: ${formatDate(sec.date)}`;
    bannerCell.font = fontSecBanner;
    bannerCell.fill = fillSecBanner;
    bannerCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    dataSheet.getRow(currentRow).height = 24;
    currentRow++;

    // Row 1: GP No & Date | Pass Type & Purpose
    dataSheet.getCell(`A${currentRow}`).value = 'Gate Pass No.:';
    dataSheet.getCell(`B${currentRow}`).value = gpNo;
    dataSheet.getCell(`C${currentRow}`).value = 'GP Date:';
    dataSheet.getCell(`D${currentRow}`).value = formatDate(sec.date);

    dataSheet.getCell(`E${currentRow}`).value = 'Pass Type:';
    dataSheet.mergeCells(`F${currentRow}:H${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = sec.passType || 'Returnable';
    dataSheet.mergeCells(`I${currentRow}:J${currentRow}`);
    dataSheet.getCell(`I${currentRow}`).value = 'Purpose:';
    dataSheet.mergeCells(`K${currentRow}:R${currentRow}`);
    dataSheet.getCell(`K${currentRow}`).value = sec.purpose || '-';

    ['A', 'C'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillLeftHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['B', 'D'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['E', 'I'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel; cell.fill = fillRightHeader; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    ['F', 'K'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderValue; cell.border = borderThin; cell.alignment = { vertical: 'middle' };
    });
    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 2: Party & GSTIN | Vendor Address
    dataSheet.getCell(`A${currentRow}`).value = 'Party / Vendor:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = `${partyName} ${sec.vendorGstin ? '(GSTIN: ' + sec.vendorGstin + ')' : ''}`;

    dataSheet.getCell(`E${currentRow}`).value = 'Vendor Address:';
    dataSheet.mergeCells(`F${currentRow}:R${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = sec.vendorAddress || 'Not specified';

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    dataSheet.getCell(`E${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`E${currentRow}`).fill = fillRightHeader;
    dataSheet.getCell(`E${currentRow}`).border = borderThin;
    dataSheet.getCell(`E${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`F${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`F${currentRow}`).border = borderThin;
    dataSheet.getCell(`F${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 3: Vehicle & Driver | Dept & Cost Centre
    dataSheet.getCell(`A${currentRow}`).value = 'Vehicle / Driver:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    dataSheet.getCell(`B${currentRow}`).value = `${sec.vehicleNumber || '-'} ${sec.driverName ? ' / Driver: ' + sec.driverName : ''}`;

    dataSheet.getCell(`E${currentRow}`).value = 'Dept / Cost Centre:';
    dataSheet.mergeCells(`F${currentRow}:R${currentRow}`);
    dataSheet.getCell(`F${currentRow}`).value = `${sec.department || '-'} ${sec.costCentre ? ' / CC: ' + sec.costCentre : ''}`;

    dataSheet.getCell(`A${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`A${currentRow}`).fill = fillLeftHeader;
    dataSheet.getCell(`A${currentRow}`).border = borderThin;
    dataSheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`B${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`B${currentRow}`).border = borderThin;
    dataSheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle' };

    dataSheet.getCell(`E${currentRow}`).font = fontHeaderLabel;
    dataSheet.getCell(`E${currentRow}`).fill = fillRightHeader;
    dataSheet.getCell(`E${currentRow}`).border = borderThin;
    dataSheet.getCell(`E${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getCell(`F${currentRow}`).font = fontHeaderValue;
    dataSheet.getCell(`F${currentRow}`).border = borderThin;
    dataSheet.getCell(`F${currentRow}`).alignment = { vertical: 'middle' };
    dataSheet.getRow(currentRow).height = 20;
    currentRow++;

    // Row 4: Gate Pass Status & Return Status with Badging!
    dataSheet.getCell(`A${currentRow}`).value = 'Gate Pass Status:';
    dataSheet.mergeCells(`B${currentRow}:D${currentRow}`);
    const gpStatusCell = dataSheet.getCell(`B${currentRow}`);
    applyStatusBadge(gpStatusCell, sec.gatePassStatus);
    gpStatusCell.border = borderThin;

    dataSheet.getCell(`E${currentRow}`).value = 'Return Status:';
    dataSheet.mergeCells(`F${currentRow}:R${currentRow}`);
    const retStatusCell = dataSheet.getCell(`F${currentRow}`);
    applyStatusBadge(retStatusCell, sec.returnStatus);
    retStatusCell.border = borderThin;

    ['A', 'E'].forEach(col => {
      const cell = dataSheet.getCell(`${col}${currentRow}`);
      cell.font = fontHeaderLabel;
      cell.fill = col === 'A' ? fillLeftHeader : fillRightHeader;
      cell.border = borderThin;
      cell.alignment = { vertical: 'middle' };
    });
    dataSheet.getRow(currentRow).height = 22;
    currentRow++;

    // Items Table Header Row
    dataSheet.mergeCells(`A${currentRow}:D${currentRow}`);
    dataSheet.getCell(`A${currentRow}`).value = 'GATE PASS & RETURN SPECIFICATION';
    dataSheet.getCell(`A${currentRow}`).font = fontTableHead;
    dataSheet.getCell(`A${currentRow}`).fill = fillItemHeadLeft;
    dataSheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    const itemHeaders = [
      { col: 'E', title: 'Item Description', align: 'left' },
      { col: 'F', title: 'Category', align: 'center' },
      { col: 'G', title: 'Orig. Qty', align: 'right' },
      { col: 'H', title: 'Ret. Qty', align: 'right' },
      { col: 'I', title: 'Inward No.', align: 'center' },
      { col: 'J', title: 'Inward Date', align: 'center' },
      { col: 'K', title: 'Rec. Qty', align: 'right' },
      { col: 'L', title: 'Bal. Qty', align: 'right' },
      { col: 'M', title: 'Unit', align: 'center' },
      { col: 'N', title: 'Rate (₹)', align: 'right' },
      { col: 'O', title: 'Taxable (₹)', align: 'right' },
      { col: 'P', title: 'GST % (Amt ₹)', align: 'right' },
      { col: 'Q', title: 'Total Amount (₹)', align: 'right' },
      { col: 'R', title: 'Item Status', align: 'center' }
    ];

    itemHeaders.forEach(h => {
      const cell = dataSheet.getCell(`${h.col}${currentRow}`);
      cell.value = h.title;
      cell.font = fontTableHead;
      cell.fill = fillItemHeadRight;
      cell.alignment = { horizontal: h.align, vertical: 'middle' };
      cell.border = borderThin;
    });
    dataSheet.getRow(currentRow).height = 22;
    currentRow++;

    // Data Rows for items
    let secOrigQty = 0;
    let secRetQty = 0;
    let secRecQty = 0;
    let secBalQty = 0;
    let secTaxable = 0;
    let secGst = 0;
    let secTotal = 0;

    sec.items.forEach((it, itemIdx) => {
      dataSheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const itemLabel = dataSheet.getCell(`A${currentRow}`);
      itemLabel.value = `Item #${itemIdx + 1}`;
      itemLabel.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
      itemLabel.alignment = { horizontal: 'center', vertical: 'middle' };
      itemLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
      itemLabel.border = borderThin;

      const origQty = Number(it.originalQuantity) || 0;
      const retQty = Number(it.returnableQuantity) || 0;
      const recQty = Number(it.receivedQuantity) || 0;
      const balQty = Number(it.balanceQuantity) || Math.max(0, retQty - recQty);
      const rateVal = Number(it.rate) || 0;
      const taxableVal = Number(it.taxableAmount) || 0;
      const gstPct = Number(it.gstPercentage) || 18;
      const gstVal = Number(it.gstAmount) || 0;
      const totalVal = Number(it.grandTotal) || 0;

      secOrigQty += origQty;
      secRetQty += retQty;
      secRecQty += recQty;
      secBalQty += balQty;
      secTaxable += taxableVal;
      secGst += gstVal;
      secTotal += totalVal;

      dataSheet.getCell(`E${currentRow}`).value = it.itemDescription || '-';
      dataSheet.getCell(`F${currentRow}`).value = it.category || 'OCR';
      dataSheet.getCell(`G${currentRow}`).value = origQty;
      dataSheet.getCell(`H${currentRow}`).value = retQty;
      dataSheet.getCell(`I${currentRow}`).value = it.inwardNumber || '-';
      dataSheet.getCell(`J${currentRow}`).value = formatDate(it.inwardDate);
      dataSheet.getCell(`K${currentRow}`).value = recQty;
      dataSheet.getCell(`L${currentRow}`).value = balQty;
      dataSheet.getCell(`M${currentRow}`).value = it.unit || 'Nos';
      dataSheet.getCell(`N${currentRow}`).value = rateVal;
      dataSheet.getCell(`O${currentRow}`).value = taxableVal;
      dataSheet.getCell(`P${currentRow}`).value = `${gstPct}% (₹${gstVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
      dataSheet.getCell(`Q${currentRow}`).value = totalVal;

      // Status Badge in Column R with Color!
      const itemStatusCell = dataSheet.getCell(`R${currentRow}`);
      applyStatusBadge(itemStatusCell, it.itemReturnStatus || it.returnStatus);
      itemStatusCell.border = borderThin;

      ['E', 'F', 'I', 'J'].forEach(c => dataSheet.getCell(`${c}${currentRow}`).alignment = { horizontal: ['F', 'I', 'J'].includes(c) ? 'center' : 'left', vertical: 'middle' });
      ['G', 'H', 'K', 'L'].forEach(c => {
        const cell = dataSheet.getCell(`${c}${currentRow}`);
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
      });
      dataSheet.getCell(`M${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      ['N', 'O', 'Q'].forEach(c => {
        const cell = dataSheet.getCell(`${c}${currentRow}`);
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '"₹" #,##0.00';
      });
      dataSheet.getCell(`P${currentRow}`).alignment = { horizontal: 'right', vertical: 'middle' };

      ['E','F','G','H','I','J','K','L','M','N','O','P','Q'].forEach(c => {
        dataSheet.getCell(`${c}${currentRow}`).font = fontDataCell;
        dataSheet.getCell(`${c}${currentRow}`).border = borderThin;
      });

      dataSheet.getRow(currentRow).height = 20;
      currentRow++;
    });

    grandOrigQty += secOrigQty;
    grandRetQty += secRetQty;
    grandRecQty += secRecQty;
    grandBalQty += secBalQty;
    grandTaxable += secTaxable;
    grandGst += secGst;
    grandAmount += secTotal;

    // Section Summary Row
    dataSheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const secTotalLabel = dataSheet.getCell(`A${currentRow}`);
    secTotalLabel.value = `SECTION TOTALS (${gpNo}):`;
    secTotalLabel.font = fontTotalCell;
    secTotalLabel.alignment = { horizontal: 'right', vertical: 'middle' };
    secTotalLabel.fill = fillSubtotal;
    secTotalLabel.border = borderDouble;

    const cellG = dataSheet.getCell(`G${currentRow}`);
    cellG.value = secOrigQty; cellG.font = fontTotalCell; cellG.numFmt = '#,##0.00'; cellG.fill = fillSubtotal; cellG.border = borderDouble; cellG.alignment = { horizontal: 'right', vertical: 'middle' };

    const cellH = dataSheet.getCell(`H${currentRow}`);
    cellH.value = secRetQty; cellH.font = fontTotalCell; cellH.numFmt = '#,##0.00'; cellH.fill = fillSubtotal; cellH.border = borderDouble; cellH.alignment = { horizontal: 'right', vertical: 'middle' };

    ['I', 'J'].forEach(c => {
      const cell = dataSheet.getCell(`${c}${currentRow}`);
      cell.value = '-'; cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = fillSubtotal; cell.border = borderDouble;
    });

    const cellK = dataSheet.getCell(`K${currentRow}`);
    cellK.value = secRecQty; cellK.font = fontTotalCell; cellK.numFmt = '#,##0.00'; cellK.fill = fillSubtotal; cellK.border = borderDouble; cellK.alignment = { horizontal: 'right', vertical: 'middle' };

    const cellL = dataSheet.getCell(`L${currentRow}`);
    cellL.value = secBalQty; cellL.font = fontTotalCell; cellL.numFmt = '#,##0.00'; cellL.fill = fillSubtotal; cellL.border = borderDouble; cellL.alignment = { horizontal: 'right', vertical: 'middle' };

    ['M', 'N'].forEach(c => {
      const cell = dataSheet.getCell(`${c}${currentRow}`);
      cell.value = '-'; cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = fillSubtotal; cell.border = borderDouble;
    });

    const cellO = dataSheet.getCell(`O${currentRow}`);
    cellO.value = secTaxable; cellO.font = fontTotalCell; cellO.numFmt = '"₹" #,##0.00'; cellO.fill = fillSubtotal; cellO.border = borderDouble; cellO.alignment = { horizontal: 'right', vertical: 'middle' };

    const cellP = dataSheet.getCell(`P${currentRow}`);
    cellP.value = secGst; cellP.font = fontTotalCell; cellP.numFmt = '"₹" #,##0.00'; cellP.fill = fillSubtotal; cellP.border = borderDouble; cellP.alignment = { horizontal: 'right', vertical: 'middle' };

    const cellQ = dataSheet.getCell(`Q${currentRow}`);
    cellQ.value = secTotal; cellQ.font = fontTotalCell; cellQ.numFmt = '"₹" #,##0.00'; cellQ.fill = fillGrandTotal; cellQ.border = borderDouble; cellQ.alignment = { horizontal: 'right', vertical: 'middle' };

    const cellR = dataSheet.getCell(`R${currentRow}`);
    cellR.value = '-'; cellR.alignment = { horizontal: 'center', vertical: 'middle' };
    cellR.fill = fillSubtotal; cellR.border = borderDouble;

    dataSheet.getRow(currentRow).height = 22;
    currentRow += 2;
  });

  // Grand Summary Banner Row
  dataSheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const grandLabel = dataSheet.getCell(`A${currentRow}`);
  grandLabel.value = `GRAND TOTAL (ALL ${sections.length} GATE PASS SECTIONS):`;
  grandLabel.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  grandLabel.alignment = { horizontal: 'right', vertical: 'middle' };
  grandLabel.fill = fillSecBanner;

  const gCellG = dataSheet.getCell(`G${currentRow}`);
  gCellG.value = grandOrigQty; gCellG.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; gCellG.alignment = { horizontal: 'right', vertical: 'middle' }; gCellG.numFmt = '#,##0.00'; gCellG.fill = fillSecBanner;

  const gCellH = dataSheet.getCell(`H${currentRow}`);
  gCellH.value = grandRetQty; gCellH.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; gCellH.alignment = { horizontal: 'right', vertical: 'middle' }; gCellH.numFmt = '#,##0.00'; gCellH.fill = fillSecBanner;

  ['I', 'J'].forEach(c => {
    const cell = dataSheet.getCell(`${c}${currentRow}`);
    cell.value = '-'; cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = fillSecBanner;
  });

  const gCellK = dataSheet.getCell(`K${currentRow}`);
  gCellK.value = grandRecQty; gCellK.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; gCellK.alignment = { horizontal: 'right', vertical: 'middle' }; gCellK.numFmt = '#,##0.00'; gCellK.fill = fillSecBanner;

  const gCellL = dataSheet.getCell(`L${currentRow}`);
  gCellL.value = grandBalQty; gCellL.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; gCellL.alignment = { horizontal: 'right', vertical: 'middle' }; gCellL.numFmt = '#,##0.00'; gCellL.fill = fillSecBanner;

  ['M', 'N'].forEach(c => {
    const cell = dataSheet.getCell(`${c}${currentRow}`);
    cell.value = '-'; cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = fillSecBanner;
  });

  const gCellO = dataSheet.getCell(`O${currentRow}`);
  gCellO.value = grandTaxable; gCellO.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; gCellO.alignment = { horizontal: 'right', vertical: 'middle' }; gCellO.numFmt = '"₹" #,##0.00'; gCellO.fill = fillSecBanner;

  const gCellP = dataSheet.getCell(`P${currentRow}`);
  gCellP.value = grandGst; gCellP.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; gCellP.alignment = { horizontal: 'right', vertical: 'middle' }; gCellP.numFmt = '"₹" #,##0.00'; gCellP.fill = fillSecBanner;

  const gCellQ = dataSheet.getCell(`Q${currentRow}`);
  gCellQ.value = grandAmount; gCellQ.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; gCellQ.alignment = { horizontal: 'right', vertical: 'middle' }; gCellQ.numFmt = '"₹" #,##0.00'; gCellQ.fill = fillSecBanner;

  const gCellR = dataSheet.getCell(`R${currentRow}`);
  gCellR.value = '-'; gCellR.alignment = { horizontal: 'center', vertical: 'middle' }; gCellR.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; gCellR.fill = fillSecBanner;

  dataSheet.getRow(currentRow).height = 25;
};

/**
 * Generate Excel Workbook for any Report Type
 */
const generateReportExcel = async ({ reportType, reportTitle, filters = {}, records = [], kpis = {} }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Maruti Denim ERP System';
  workbook.created = new Date();

  const istNow = format(new Date(), 'dd-MM-yyyy HH:mm:ss');

  // ==========================================
  // SHEET 1: Report Summary
  // ==========================================
  const summarySheet = workbook.addWorksheet('Report Summary', { views: [{ showGridLines: true }] });

  // Title Block
  summarySheet.mergeCells('A1:F1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'MARUTI NANDAN DENIM PVT LTD';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 30;

  summarySheet.mergeCells('A2:F2');
  const subTitleCell = summarySheet.getCell('A2');
  subTitleCell.value = `${reportTitle.toUpperCase()} - MANAGEMENT MIS REPORT`;
  subTitleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF1E293B' } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(2).height = 24;

  summarySheet.addRow([]);

  // Report Info Block
  summarySheet.addRow(['Report Title:', reportTitle]);
  summarySheet.addRow(['Generated Date & Time (IST):', istNow]);
  summarySheet.addRow(['Report Period:', `${filters.fromDate || 'Beginning'} to ${filters.toDate || 'Present'}`]);
  summarySheet.addRow(['Total Records:', records.length]);
  summarySheet.addRow(['Generated By:', 'Admin System']);

  // Format Labels
  for (let r = 4; r <= 8; r++) {
    const row = summarySheet.getRow(r);
    row.getCell(1).font = { bold: true, color: { argb: 'FF475569' } };
    row.getCell(2).font = { bold: true, color: { argb: 'FF0F2A47' } };
  }

  summarySheet.addRow([]);

  // Filter Details Block
  summarySheet.addRow(['APPLIED FILTERS SUMMARY']).font = { bold: true, size: 11, color: { argb: 'FF0F2A47' } };
  const filterKeys = Object.keys(filters).filter(k => filters[k] && filters[k] !== 'All');
  if (filterKeys.length === 0) {
    summarySheet.addRow(['Filters:', 'None (All Records Included)']);
  } else {
    filterKeys.forEach(k => {
      summarySheet.addRow([`${k}:`, String(filters[k])]);
    });
  }

  summarySheet.addRow([]);

  // KPI Summary Metrics Block
  summarySheet.addRow(['KEY PERFORMANCE INDICATORS (KPIs)']).font = { bold: true, size: 11, color: { argb: 'FF0F2A47' } };
  Object.entries(kpis).forEach(([kpiKey, kpiVal]) => {
    const label = kpiKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    summarySheet.addRow([label, typeof kpiVal === 'number' ? kpiVal : String(kpiVal)]);
  });

  // Column Widths for Summary Sheet
  summarySheet.getColumn(1).width = 30;
  summarySheet.getColumn(2).width = 40;

  // ==========================================
  // SHEET 2: Detailed Data Sheet
  // ==========================================
  if (reportType === 'gate-pass') {
    buildSectionWiseGatePassSheet(workbook, reportTitle, records);
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  if (reportType === 'material-inward') {
    buildSectionWiseInwardSheet(workbook, reportTitle, records);
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  if (reportType === 'combined') {
    buildSectionWiseCombinedSheet(workbook, reportTitle, records);
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  const dataSheetName = reportTitle.substring(0, 30);
  const dataSheet = workbook.addWorksheet(dataSheetName, { views: [{ state: 'frozen', ySplit: 1, showGridLines: true }] });

  if (!records || records.length === 0) {
    dataSheet.addRow(['No records found for the selected filters.']).font = { italic: true, color: { argb: 'FF64748B' } };
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  // Define Columns & Alignments per Report Type
  let columnsConfig = [];

  switch (reportType) {
    case 'gate-pass':
      columnsConfig = [
        { header: 'Sr. No.', key: 'srNo', width: 8, align: 'center' },
        { header: 'Gate Pass No.', key: 'gatePassNumber', width: 16, align: 'center' },
        { header: 'Gate Pass Date', key: 'date', width: 14, align: 'center', isDate: true },
        { header: 'Party / Company Name', key: 'companyName', width: 28, align: 'left' },
        { header: 'Vendor Address', key: 'vendorAddress', width: 25, align: 'left' },
        { header: 'GSTIN', key: 'vendorGstin', width: 18, align: 'center' },
        { header: 'Purpose', key: 'purpose', width: 22, align: 'left' },
        { header: 'Material Type', key: 'materialType', width: 14, align: 'center' },
        { header: 'Total Qty', key: 'totalQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Ret. Qty', key: 'returnableQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Rec. Qty', key: 'returnedQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Bal. Qty', key: 'balanceReturnableQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Approval', key: 'approvalStatus', width: 14, align: 'center' },
        { header: 'GP Status', key: 'gatePassStatus', width: 14, align: 'center' },
        { header: 'Return Status', key: 'returnStatus', width: 18, align: 'center' },
        { header: 'Remarks', key: 'remarks', width: 25, align: 'left' }
      ];
      break;

    case 'returnable-material':
    case 'pending-returns':
      columnsConfig = [
        { header: 'Sr. No.', key: 'srNo', width: 8, align: 'center' },
        { header: 'Gate Pass No.', key: 'gatePassNumber', width: 16, align: 'center' },
        { header: 'Gate Pass Date', key: 'date', width: 14, align: 'center', isDate: true },
        { header: 'Party / Company Name', key: 'companyName', width: 26, align: 'left' },
        { header: 'Item Description', key: 'itemName', width: 24, align: 'left' },
        { header: 'Orig. Qty', key: 'originalQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Ret. Qty', key: 'returnableQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Rec. Qty', key: 'returnedQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Pend. Qty', key: 'pendingQuantity', width: 12, align: 'right', numFmt: '#,##0.00', isSum: true },
        ...(reportType === 'pending-returns' ? [{ header: 'Days Pending', key: 'daysPending', width: 14, align: 'right', numFmt: '#,##0' }] : []),
        { header: 'Return Status', key: 'returnStatus', width: 18, align: 'center' },
        { header: 'Remarks', key: 'remarks', width: 22, align: 'left' }
      ];
      break;

    case 'gate-pass-closure':
      columnsConfig = [
        { header: 'Sr. No.', key: 'srNo', width: 8, align: 'center' },
        { header: 'Gate Pass No.', key: 'gatePassNumber', width: 16, align: 'center' },
        { header: 'Gate Pass Date', key: 'date', width: 14, align: 'center', isDate: true },
        { header: 'Party / Company Name', key: 'companyName', width: 26, align: 'left' },
        { header: 'Orig. Returnable Qty', key: 'originalReturnableQuantity', width: 18, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Total Returned Qty', key: 'totalReturnedQuantity', width: 18, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Final Inward No.', key: 'finalInwardNumber', width: 18, align: 'center' },
        { header: 'Days to Close', key: 'totalDaysToClose', width: 14, align: 'right', numFmt: '#,##0' },
        { header: 'Return Status', key: 'returnStatus', width: 18, align: 'center' }
      ];
      break;

    case 'party-summary':
      columnsConfig = [
        { header: 'Sr. No.', key: 'srNo', width: 8, align: 'center' },
        { header: 'Party / Company Name', key: 'partyName', width: 28, align: 'left' },
        { header: 'Total Gate Passes', key: 'totalGatePasses', width: 16, align: 'right', numFmt: '#,##0', isSum: true },
        { header: 'Open Passes', key: 'openGatePasses', width: 14, align: 'right', numFmt: '#,##0', isSum: true },
        { header: 'Closed Passes', key: 'closedGatePasses', width: 14, align: 'right', numFmt: '#,##0', isSum: true },
        { header: 'Returnable Qty', key: 'totalReturnableQuantity', width: 16, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Returned Qty', key: 'totalReturnedQuantity', width: 16, align: 'right', numFmt: '#,##0.00', isSum: true },
        { header: 'Pending Qty', key: 'totalPendingQuantity', width: 16, align: 'right', numFmt: '#,##0.00', isSum: true }
      ];
      break;

    default:
      break;
  }

  // Set Header Columns
  dataSheet.columns = columnsConfig.map(c => ({
    header: c.header,
    key: c.key,
    width: c.width
  }));

  // Style Header Row
  const headerRow = dataSheet.getRow(1);
  headerRow.height = 25;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
    cell.alignment = { horizontal: columnsConfig[colNumber - 1]?.align || 'left', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0F2A47' } },
      left: { style: 'thin', color: { argb: 'FF1E293B' } },
      bottom: { style: 'medium', color: { argb: 'FF0F2A47' } },
      right: { style: 'thin', color: { argb: 'FF1E293B' } }
    };
  });

  // Enable AutoFilter
  const lastColLetter = String.fromCharCode(64 + columnsConfig.length);
  dataSheet.autoFilter = `A1:${lastColLetter}1`;

  // Add Data Rows
  records.forEach((rec, idx) => {
    const rowObj = { srNo: idx + 1 };
    columnsConfig.forEach(col => {
      if (col.key === 'srNo') return;
      let val = rec[col.key];

      if (col.isDate) {
        val = formatDate(val, col.withTime);
      }
      rowObj[col.key] = val !== undefined && val !== null ? val : '-';
    });

    const dataRow = dataSheet.addRow(rowObj);
    dataRow.height = 20;

    dataRow.eachCell((cell, colNumber) => {
      const config = columnsConfig[colNumber - 1];
      cell.alignment = { horizontal: config?.align || 'left', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      if (config?.numFmt && typeof cell.value === 'number') {
        cell.numFmt = config.numFmt;
      }
    });
  });

  // Add Grand Total Row with Excel SUM formulas
  const totalRowObj = { srNo: '' };
  totalRowObj[columnsConfig[1].key] = 'TOTAL';

  columnsConfig.forEach((col, cIdx) => {
    if (col.isSum) {
      const colLetter = String.fromCharCode(65 + cIdx);
      const startRow = 2;
      const endRow = records.length + 1;
      totalRowObj[col.key] = { formula: `SUM(${colLetter}${startRow}:${colLetter}${endRow})` };
    }
  });

  const totalRow = dataSheet.addRow(totalRowObj);
  totalRow.height = 24;

  totalRow.eachCell((cell, colNumber) => {
    const config = columnsConfig[colNumber - 1];
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F2A47' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.alignment = { horizontal: config?.align || 'left', vertical: 'middle' };
    cell.border = {
      top: { style: 'double', color: { argb: 'FF0F2A47' } },
      bottom: { style: 'double', color: { argb: 'FF0F2A47' } }
    };

    if (config?.numFmt) {
      cell.numFmt = config.numFmt;
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  generateReportExcel
};
