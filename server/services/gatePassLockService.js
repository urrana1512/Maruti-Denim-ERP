const mongoose = require('mongoose');
const GatePass = require('../models/GatePass');
const MaterialInward = require('../models/MaterialInward');

const isDbConnected = () => mongoose.connection.readyState === 1;

const PROTECTED_HEADER_FIELDS = [
  'companyName',
  'partyName',
  'vendorId',
  'vendorAddress',
  'vendorCity',
  'vendorPincode',
  'vendorGstin',
  'vendorPanCard',
  'vehicleNumber',
  'driverName',
  'date',
  'passType',
  'gatePassType',
  'department',
  'costCentre'
];

const PROTECTED_ITEM_FIELDS = [
  'description',
  'category',
  'quantity',
  'uom',
  'returnable',
  'rate',
  'gstPercentage',
  'costCentre'
];

/**
 * Determine Lock State for a Gate Pass
 * Single Shared Source of Truth called by Lock-State API, Update Validator, and Frontend
 */
const getGatePassLockState = async (gatePassOrId) => {
  let gatePass = null;
  if (!gatePassOrId) {
    return { gatePassLocked: false, lockReason: null, items: [], protectedHeaderFields: [] };
  }

  if (typeof gatePassOrId === 'string' || gatePassOrId instanceof mongoose.Types.ObjectId) {
    const gatePassService = require('./gatePassService');
    gatePass = await gatePassService.getGatePassById(gatePassOrId);
  } else {
    gatePass = gatePassOrId;
  }

  if (!gatePass) {
    return { gatePassLocked: false, lockReason: null, items: [], protectedHeaderFields: [] };
  }

  const gatePassId = gatePass._id ? String(gatePass._id) : String(gatePass.id);
  const gpStatus = String(gatePass.gatePassStatus || gatePass.status || '').toUpperCase();
  const isClosedOrCancelled = gpStatus === 'CLOSED' || gpStatus === 'CANCELLED';

  // Fetch all Material Inward records for this Gate Pass to double-check received quantities
  let inwardItems = [];
  if (isDbConnected() && mongoose.Types.ObjectId.isValid(gatePassId)) {
    const inwards = await MaterialInward.find({ gatePassId }).lean();
    for (const inv of inwards) {
      for (const item of (inv.items || [])) {
        if (item.gatePassItemId) {
          inwardItems.push(item);
        }
      }
    }
  }

  // Calculate received quantities per item
  let anyReturnableReceived = false;
  const itemsLockInfo = (gatePass.items || []).map((item, idx) => {
    const itemIdStr = item._id ? String(item._id) : (item.gatePassItemId ? String(item.gatePassItemId) : String(idx));
    
    // Sum received quantity across inward history for this item
    const inwardReceived = inwardItems
      .filter(invItem => String(invItem.gatePassItemId) === itemIdStr)
      .reduce((sum, invItem) => sum + (Number(invItem.receivedQuantity) || 0), 0);

    const receivedQuantity = Math.max(Number(item.receivedQuantity) || 0, inwardReceived);
    const originalQuantity = Number(item.quantity) || 0;
    const isReturnable = item.returnable !== false;

    if (isReturnable && receivedQuantity > 0) {
      anyReturnableReceived = true;
    }

    const itemReceivedLocked = receivedQuantity > 0;
    
    let reason = null;
    if (gpStatus === 'CANCELLED') {
      reason = 'GATE_PASS_CANCELLED';
    } else if (gpStatus === 'CLOSED') {
      reason = 'GATE_PASS_CLOSED';
    } else if (receivedQuantity >= originalQuantity && originalQuantity > 0) {
      reason = 'FULLY_RETURNED';
    } else if (receivedQuantity > 0) {
      reason = 'PARTIALLY_RETURNED';
    }

    return {
      gatePassItemId: itemIdStr,
      itemIndex: idx,
      description: item.description,
      originalQuantity,
      receivedQuantity,
      returnable: isReturnable,
      locked: itemReceivedLocked || isClosedOrCancelled,
      reason
    };
  });

  const gatePassLocked = anyReturnableReceived || isClosedOrCancelled;

  let lockReason = null;
  if (gpStatus === 'CANCELLED') lockReason = 'GATE_PASS_CANCELLED';
  else if (gpStatus === 'CLOSED') lockReason = 'GATE_PASS_CLOSED';
  else if (anyReturnableReceived) lockReason = 'INWARD_PROCESSED';

  // Mark all items locked if the overall Gate Pass is locked
  const updatedItems = itemsLockInfo.map(item => ({
    ...item,
    locked: item.locked || gatePassLocked,
    reason: item.reason || (gatePassLocked ? lockReason : null)
  }));

  return {
    gatePassId,
    gatePassNumber: gatePass.gatePassNumber,
    gatePassLocked,
    lockReason,
    items: updatedItems,
    protectedHeaderFields: gatePassLocked ? PROTECTED_HEADER_FIELDS : []
  };
};

/**
 * Perform Field-Level Diffing on Proposed Gate Pass Update
 */
const diffAndValidateGatePassUpdate = (existingGatePass, lockState, updatePayload) => {
  const lockedFields = [];

  if (!lockState.gatePassLocked) {
    return { allowed: true, lockedFields: [] };
  }

  // 1. Check Protected Header Fields
  for (const field of PROTECTED_HEADER_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updatePayload, field)) {
      const existingVal = existingGatePass[field] != null ? String(existingGatePass[field]) : '';
      const newVal = updatePayload[field] != null ? String(updatePayload[field]) : '';
      
      // Compare values (ignoring date string formatting differences)
      if (field === 'date') {
        const d1 = new Date(existingGatePass.date).toISOString().split('T')[0];
        const d2 = new Date(updatePayload.date).toISOString().split('T')[0];
        if (d1 !== d2) lockedFields.push('date');
      } else if (existingVal !== newVal) {
        lockedFields.push(field);
      }
    }
  }

  // 2. Check Item Set Stability (Addition/Deletion/Reordering of Items)
  const existingItems = existingGatePass.items || [];
  const updatedItems = updatePayload.items;

  if (Array.isArray(updatedItems)) {
    if (updatedItems.length !== existingItems.length) {
      lockedFields.push('items.length');
    } else {
      // Compare each item field-by-field
      updatedItems.forEach((upItem, idx) => {
        const exItem = existingItems[idx];
        const itemLock = lockState.items[idx] || { locked: true };

        if (exItem && itemLock.locked) {
          for (const itemField of PROTECTED_ITEM_FIELDS) {
            if (Object.prototype.hasOwnProperty.call(upItem, itemField)) {
              const exVal = exItem[itemField] != null ? String(exItem[itemField]) : '';
              const upVal = upItem[itemField] != null ? String(upItem[itemField]) : '';

              if (itemField === 'returnable') {
                if (Boolean(exItem.returnable) !== Boolean(upItem.returnable)) {
                  lockedFields.push(`items[${idx}].returnable`);
                }
              } else if (itemField === 'quantity') {
                if (Number(exItem.quantity) !== Number(upItem.quantity)) {
                  lockedFields.push(`items[${idx}].quantity`);
                }
              } else if (exVal !== upVal) {
                lockedFields.push(`items[${idx}].${itemField}`);
              }
            }
          }
        }
      });
    }
  }

  return {
    allowed: lockedFields.length === 0,
    lockedFields
  };
};

module.exports = {
  getGatePassLockState,
  diffAndValidateGatePassUpdate,
  PROTECTED_HEADER_FIELDS,
  PROTECTED_ITEM_FIELDS
};
