/**
 * Frontend GST & Line Item Amount Calculator
 */

export const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

export const calculateLineItemGST = ({ receivedQuantity, rate, gstType = 'CGST_SGST', gstPercentage = 18 }) => {
  const qty = Math.max(0, Number(receivedQuantity) || 0);
  const unitRate = Math.max(0, Number(rate) || 0);
  const taxableAmount = round2(qty * unitRate);

  const slab = [0, 5, 12, 18, 28].includes(Number(gstPercentage)) ? Number(gstPercentage) : 18;

  let cgstPercentage = 0;
  let sgstPercentage = 0;
  let igstPercentage = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let gstAmount = 0;

  if (gstType === 'CGST_SGST') {
    cgstPercentage = round2(slab / 2);
    sgstPercentage = round2(slab / 2);
    cgstAmount = round2((taxableAmount * cgstPercentage) / 100);
    sgstAmount = round2((taxableAmount * sgstPercentage) / 100);
    gstAmount = round2(cgstAmount + sgstAmount);
  } else if (gstType === 'IGST') {
    igstPercentage = slab;
    igstAmount = round2((taxableAmount * igstPercentage) / 100);
    gstAmount = igstAmount;
  } else if (gstType === 'NONE') {
    gstAmount = 0;
  }

  const totalAmount = round2(taxableAmount + gstAmount);

  return {
    taxableAmount,
    gstType,
    gstPercentage: gstType === 'NONE' ? 0 : slab,
    cgstPercentage,
    sgstPercentage,
    igstPercentage,
    cgstAmount,
    sgstAmount,
    igstAmount,
    gstAmount,
    totalAmount
  };
};

export const calculateDocumentTotals = (items = []) => {
  let totalReceivedQty = 0;
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalGst = 0;
  let grandTotal = 0;

  items.forEach(item => {
    const qty = Number(item.receivedQuantity) || 0;
    if (qty > 0) {
      totalReceivedQty += qty;
      subtotal += item.taxableAmount || 0;
      totalCgst += item.cgstAmount || 0;
      totalSgst += item.sgstAmount || 0;
      totalIgst += item.igstAmount || 0;
      totalGst += item.gstAmount || 0;
      grandTotal += item.totalAmount || 0;
    }
  });

  return {
    totalReceivedQty,
    subtotal: round2(subtotal),
    totalCgst: round2(totalCgst),
    totalSgst: round2(totalSgst),
    totalIgst: round2(totalIgst),
    totalGst: round2(totalGst),
    grandTotal: round2(grandTotal)
  };
};

export const calculateInwardTotals = (itemRows = [], taxType = 'CGST_SGST') => {
  const calculatedItems = itemRows.map(row => {
    const gstCalc = calculateLineItemGST({
      receivedQuantity: row.receiveQty || 0,
      rate: row.rate || 0,
      gstType: taxType,
      gstPercentage: row.gstPercentage || 18
    });
    return {
      ...row,
      receivedQuantity: row.receiveQty || 0,
      ...gstCalc
    };
  });

  return calculateDocumentTotals(calculatedItems);
};

export const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(val || 0);
};
