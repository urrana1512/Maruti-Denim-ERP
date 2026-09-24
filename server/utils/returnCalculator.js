/**
 * Helper utility to calculate return status for individual items and overall Gate Pass.
 */

const calculateItemReturnStatus = (originalQty, receivedQty) => {
  const received = Math.max(0, Number(receivedQty) || 0);
  const original = Number(originalQty) || 0;

  if (received <= 0) return 'PENDING';
  if (received < original) return 'PARTIALLY_RETURNED';
  return 'FULLY_RETURNED';
};

const calculateGatePassReturnStatus = (items = []) => {
  const returnableItems = items.filter(item => item.returnable !== false);

  if (returnableItems.length === 0) {
    return {
      returnStatus: 'NOT_APPLICABLE',
      gatePassStatus: 'OPEN',
      gatePassType: 'Non-Returnable'
    };
  }

  let allFullyReturned = true;
  let hasAnyReceived = false;

  returnableItems.forEach(item => {
    const received = Math.max(0, Number(item.receivedQuantity) || 0);
    const original = Number(item.quantity) || 0;

    if (received > 0) {
      hasAnyReceived = true;
    }
    if (received < original) {
      allFullyReturned = false;
    }
  });

  let returnStatus = 'PENDING';
  if (allFullyReturned) {
    returnStatus = 'FULLY_RETURNED';
  } else if (hasAnyReceived) {
    returnStatus = 'PARTIALLY_RETURNED';
  }

  const gatePassStatus = (returnStatus === 'FULLY_RETURNED') ? 'CLOSED' : 'OPEN';

  const nonReturnableItemsCount = items.length - returnableItems.length;
  let gatePassType = 'Returnable';
  if (nonReturnableItemsCount === items.length) {
    gatePassType = 'Non-Returnable';
  } else if (nonReturnableItemsCount > 0) {
    gatePassType = 'Mixed';
  }

  return {
    returnStatus,
    gatePassStatus,
    gatePassType
  };
};

module.exports = {
  calculateItemReturnStatus,
  calculateGatePassReturnStatus
};
