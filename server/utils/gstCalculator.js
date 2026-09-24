/**
 * Server-side GST and Line Item Amount Calculator
 */

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const calculateLineItemGST = ({ receivedQuantity, rate, gstType = 'CGST_SGST', gstPercentage = 18 }) => {
  const qty = Number(receivedQuantity) || 0;
  const unitRate = Number(rate) || 0;
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
    // Zero GST
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

const calculateDocumentTotals = (items = []) => {
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalGst = 0;
  let grandTotal = 0;

  items.forEach(item => {
    subtotal += item.taxableAmount || 0;
    totalCgst += item.cgstAmount || 0;
    totalSgst += item.sgstAmount || 0;
    totalIgst += item.igstAmount || 0;
    totalGst += item.gstAmount || 0;
    grandTotal += item.totalAmount || 0;
  });

  return {
    subtotal: round2(subtotal),
    totalCgst: round2(totalCgst),
    totalSgst: round2(totalSgst),
    totalIgst: round2(totalIgst),
    totalGst: round2(totalGst),
    grandTotal: round2(grandTotal)
  };
};

module.exports = {
  round2,
  calculateLineItemGST,
  calculateDocumentTotals
};
