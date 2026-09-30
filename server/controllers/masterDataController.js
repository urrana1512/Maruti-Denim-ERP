const ItemMaster = require('../models/ItemMaster');
const VendorMaster = require('../models/VendorMaster');
const MasterDataAudit = require('../models/MasterDataAudit');
const GatePass = require('../models/GatePass');
const MaterialInward = require('../models/MaterialInward');
const ExcelJS = require('exceljs');
const { format } = require('date-fns');

const normalizeString = (str) => {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/\s+/g, ' ');
};

// Helper: Generate next Code (finding max existing numerical code to avoid collision)
async function generateNextItemCode() {
  const items = await ItemMaster.find({}, { itemCode: 1 }).lean();
  let maxNum = 0;
  items.forEach(i => {
    if (i.itemCode) {
      const match = i.itemCode.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });
  return `ITEM-${String(maxNum + 1).padStart(4, '0')}`;
}

async function generateNextVendorCode() {
  const vendors = await VendorMaster.find({}, { vendorCode: 1 }).lean();
  let maxNum = 0;
  vendors.forEach(v => {
    if (v.vendorCode) {
      const match = v.vendorCode.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });
  return `VEN-${String(maxNum + 1).padStart(4, '0')}`;
}

// ---------------------------------------------------------
// ITEM MASTER CONTROLLER METHODS
// ---------------------------------------------------------

exports.getItems = async (req, res) => {
  try {
    const { search = '', status = 'ALL', page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    if (status && status.toUpperCase() !== 'ALL') {
      query.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const term = search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [
        { description: regex },
        { um: regex },
        { itemCode: regex }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, totalItems] = await Promise.all([
      ItemMaster.find(query).sort(sort).skip(skip).limit(limitNum),
      ItemMaster.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    res.json({
      success: true,
      data: items,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (err) {
    console.error('Error fetching Item Master:', err);
    res.status(500).json({ success: false, message: 'Unable to load item master data. Please try again.', error: err.message });
  }
};

exports.getActiveItems = async (req, res) => {
  try {
    const items = await ItemMaster.find({ status: 'ACTIVE' })
      .select('_id itemCode description um')
      .sort({ descriptionNormalized: 1 });

    res.json({
      success: true,
      data: items
    });
  } catch (err) {
    console.error('Error fetching active items:', err);
    res.status(500).json({ success: false, message: 'Unable to load item dropdown list.' });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = await ItemMaster.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item master record not found.' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching item details.' });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { description, um, status = 'ACTIVE' } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Item description is required.' });
    }
    if (!um || !um.trim()) {
      return res.status(400).json({ success: false, message: 'Unit of measurement (UM) is required.' });
    }

    const descTrimmed = description.trim();
    const umTrimmed = um.trim();
    const normDesc = normalizeString(descTrimmed);
    const escapeRegex = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const umRegex = new RegExp(`^${escapeRegex(umTrimmed)}$`, 'i');

    // Duplicate check
    const existing = await ItemMaster.findOne({ descriptionNormalized: normDesc, um: umRegex });
    if (existing) {
      if (existing.status === 'INACTIVE') {
        // Auto-reactivate inactive item record
        existing.status = 'ACTIVE';
        existing.description = descTrimmed;
        existing.um = umTrimmed;
        existing.updatedBy = req.body.createdBy || 'Admin';
        await existing.save();

        await MasterDataAudit.create({
          entityType: 'ITEM',
          entityId: existing._id,
          action: 'ACTIVATED',
          performedBy: req.body.createdBy || 'Admin',
          newValue: existing.toObject()
        });

        return res.status(200).json({
          success: true,
          message: `Item "${existing.description}" (${existing.itemCode}) existed in inactive records and has been reactivated successfully.`,
          data: existing
        });
      }

      return res.status(400).json({ 
        success: false, 
        message: `An item with description "${existing.description}" (${existing.itemCode}) and UM (${existing.um}) already exists.` 
      });
    }

    const itemCode = await generateNextItemCode();

    const newItem = await ItemMaster.create({
      itemCode,
      description: descTrimmed,
      descriptionNormalized: normDesc,
      um: umTrimmed,
      status: status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      createdBy: req.body.createdBy || 'Admin'
    });

    await MasterDataAudit.create({
      entityType: 'ITEM',
      entityId: newItem._id,
      action: 'CREATED',
      performedBy: req.body.createdBy || 'Admin',
      newValue: newItem.toObject()
    });

    res.status(201).json({
      success: true,
      message: 'Item description created successfully.',
      data: newItem
    });
  } catch (err) {
    console.error('Error creating Item Master:', err);
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'An item with this description and unit of measurement already exists.' 
      });
    }
    res.status(500).json({ success: false, message: 'Failed to create item description.', error: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, um, status } = req.body;

    const item = await ItemMaster.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item master record not found.' });
    }

    const oldVal = item.toObject();

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({ success: false, message: 'Item description is required.' });
      }
      item.description = description.trim();
      item.descriptionNormalized = normalizeString(description);
    }

    if (um !== undefined) {
      if (!um.trim()) {
        return res.status(400).json({ success: false, message: 'Unit of measurement (UM) is required.' });
      }
      item.um = um.trim();
    }

    if (status !== undefined) {
      item.status = status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    }

    item.updatedBy = req.body.updatedBy || 'Admin';

    const escapeRegex = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const umRegex = new RegExp(`^${escapeRegex(item.um)}$`, 'i');

    // Check duplicate if description or um changed
    const duplicate = await ItemMaster.findOne({
      _id: { $ne: id },
      descriptionNormalized: item.descriptionNormalized,
      um: umRegex
    });

    if (duplicate) {
      return res.status(400).json({ 
        success: false, 
        message: `An item with description "${duplicate.description}" (${duplicate.itemCode}) and UM (${duplicate.um}) already exists.` 
      });
    }

    await item.save();

    await MasterDataAudit.create({
      entityType: 'ITEM',
      entityId: item._id,
      action: 'UPDATED',
      performedBy: req.body.updatedBy || 'Admin',
      oldValue: oldVal,
      newValue: item.toObject()
    });

    res.json({
      success: true,
      message: 'Item description updated successfully.',
      data: item
    });
  } catch (err) {
    console.error('Error updating Item Master:', err);
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'An item with this description and unit of measurement already exists.' 
      });
    }
    res.status(500).json({ success: false, message: 'Failed to update item description.' });
  }
};

exports.updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const newStatus = (status || '').toUpperCase();
    if (!['ACTIVE', 'INACTIVE'].includes(newStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const item = await ItemMaster.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item master record not found.' });
    }

    const oldVal = item.toObject();
    item.status = newStatus;
    item.updatedBy = req.body.updatedBy || 'Admin';
    await item.save();

    await MasterDataAudit.create({
      entityType: 'ITEM',
      entityId: item._id,
      action: newStatus === 'ACTIVE' ? 'ACTIVATED' : 'DEACTIVATED',
      performedBy: req.body.updatedBy || 'Admin',
      oldValue: oldVal,
      newValue: item.toObject()
    });

    res.json({
      success: true,
      message: `Item ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`,
      data: item
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update item status.' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await ItemMaster.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item master record not found.' });
    }

    // Check usage in GatePass items or MaterialInward items
    const [gpCount, miCount] = await Promise.all([
      GatePass.countDocuments({
        $or: [
          { 'items.itemId': id },
          { 'items.description': item.description }
        ]
      }),
      MaterialInward.countDocuments({
        $or: [
          { 'items.itemId': id },
          { 'items.description': item.description }
        ]
      })
    ]);

    if (gpCount > 0 || miCount > 0) {
      return res.status(400).json({
        success: false,
        isReferenced: true,
        message: 'This item cannot be deleted because it is already used in existing transactions. You can deactivate it instead.'
      });
    }

    const oldVal = item.toObject();
    await ItemMaster.findByIdAndDelete(id);

    await MasterDataAudit.create({
      entityType: 'ITEM',
      entityId: id,
      action: 'DELETED',
      performedBy: req.body.performedBy || 'Admin',
      oldValue: oldVal
    });

    res.json({
      success: true,
      message: 'Item description deleted successfully.'
    });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ success: false, message: 'Failed to delete item description.' });
  }
};

exports.importItems = async (req, res) => {
  try {
    const { items = [] } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided for import.' });
    }

    let inserted = 0;
    let skipped = 0;
    let duplicatesInFile = 0;
    const rejected = [];
    const seenInFile = new Set();

    let count = await ItemMaster.countDocuments();

    for (const item of items) {
      const description = (item.description || '').trim();
      const um = (item.uom || item.um || 'Nos').trim();

      if (!description) {
        rejected.push({ row: item, reason: 'Missing item description' });
        continue;
      }
      if (!um) {
        rejected.push({ row: item, reason: 'Missing unit of measurement (UM)' });
        continue;
      }

      const normDesc = normalizeString(description);
      const dedupeKey = `${normDesc}___${normalizeString(um)}`;

      if (seenInFile.has(dedupeKey)) {
        duplicatesInFile++;
        continue;
      }
      seenInFile.add(dedupeKey);

      const existing = await ItemMaster.findOne({ descriptionNormalized: normDesc, um });
      if (existing) {
        skipped++;
      } else {
        count++;
        const itemCode = `ITEM-${String(count).padStart(4, '0')}`;
        const newItem = await ItemMaster.create({
          itemCode,
          description,
          descriptionNormalized: normDesc,
          um,
          status: 'ACTIVE',
          createdBy: req.body.performedBy || 'Admin (Import)'
        });

        await MasterDataAudit.create({
          entityType: 'ITEM',
          entityId: newItem._id,
          action: 'IMPORTED',
          performedBy: req.body.performedBy || 'Admin (Import)',
          newValue: newItem.toObject()
        });

        inserted++;
      }
    }

    res.json({
      success: true,
      message: `Import processed: ${inserted} inserted, ${skipped} skipped, ${duplicatesInFile} file duplicates, ${rejected.length} rejected.`,
      summary: {
        totalProvided: items.length,
        inserted,
        skipped,
        duplicatesInFile,
        rejectedCount: rejected.length,
        rejected
      }
    });
  } catch (err) {
    console.error('Error importing items:', err);
    res.status(500).json({ success: false, message: 'Failed to import items.' });
  }
};


// ---------------------------------------------------------
// VENDOR MASTER CONTROLLER METHODS
// ---------------------------------------------------------

exports.getVendors = async (req, res) => {
  try {
    const { search = '', status = 'ALL', page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    if (status && status.toUpperCase() !== 'ALL') {
      query.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const term = search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [
        { vendorName: regex },
        { vendorCode: regex }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [vendors, totalItems] = await Promise.all([
      VendorMaster.find(query).sort(sort).skip(skip).limit(limitNum),
      VendorMaster.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    res.json({
      success: true,
      data: vendors,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (err) {
    console.error('Error fetching Vendor Master:', err);
    res.status(500).json({ success: false, message: 'Unable to load vendor master data. Please try again.', error: err.message });
  }
};

exports.getActiveVendors = async (req, res) => {
  try {
    const vendors = await VendorMaster.find({ status: 'ACTIVE' })
      .select('_id vendorCode vendorName address city pincode gstin panCard')
      .sort({ vendorNameNormalized: 1 });

    res.json({
      success: true,
      data: vendors
    });
  } catch (err) {
    console.error('Error fetching active vendors:', err);
    res.status(500).json({ success: false, message: 'Unable to load vendor dropdown list.' });
  }
};

exports.getVendorById = async (req, res) => {
  try {
    const vendor = await VendorMaster.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor master record not found.' });
    }
    res.json({ success: true, data: vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching vendor details.' });
  }
};

exports.createVendor = async (req, res) => {
  try {
    const { 
      vendorName, 
      address = '', 
      city = '', 
      pincode = '', 
      gstin = '', 
      panCard = '', 
      status = 'ACTIVE' 
    } = req.body;

    if (!vendorName || !vendorName.trim()) {
      return res.status(400).json({ success: false, message: 'Vendor name is required.' });
    }

    const nameTrimmed = vendorName.trim();
    const normName = normalizeString(nameTrimmed);

    const existing = await VendorMaster.findOne({ vendorNameNormalized: normName });
    if (existing) {
      if (existing.status === 'INACTIVE') {
        // Auto-reactivate inactive vendor record
        existing.status = 'ACTIVE';
        existing.vendorName = nameTrimmed;
        existing.address = address ? address.trim() : '';
        existing.city = city ? city.trim() : '';
        existing.pincode = pincode ? pincode.trim() : '';
        existing.gstin = gstin ? gstin.trim().toUpperCase() : '';
        existing.panCard = panCard ? panCard.trim().toUpperCase() : '';
        existing.updatedBy = req.body.createdBy || 'Admin';
        await existing.save();

        await MasterDataAudit.create({
          entityType: 'VENDOR',
          entityId: existing._id,
          action: 'ACTIVATED',
          performedBy: req.body.createdBy || 'Admin',
          newValue: existing.toObject()
        });

        return res.status(200).json({
          success: true,
          message: `Vendor "${existing.vendorName}" (${existing.vendorCode}) existed in inactive records and has been reactivated successfully.`,
          data: existing
        });
      }

      return res.status(400).json({ 
        success: false, 
        message: `Vendor "${existing.vendorName}" (${existing.vendorCode}) already exists.` 
      });
    }

    const vendorCode = await generateNextVendorCode();

    const newVendor = await VendorMaster.create({
      vendorCode,
      vendorName: nameTrimmed,
      vendorNameNormalized: normName,
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      pincode: pincode ? pincode.trim() : '',
      gstin: gstin ? gstin.trim().toUpperCase() : '',
      panCard: panCard ? panCard.trim().toUpperCase() : '',
      status: status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      createdBy: req.body.createdBy || 'Admin'
    });

    await MasterDataAudit.create({
      entityType: 'VENDOR',
      entityId: newVendor._id,
      action: 'CREATED',
      performedBy: req.body.createdBy || 'Admin',
      newValue: newVendor.toObject()
    });

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully.',
      data: newVendor
    });
  } catch (err) {
    console.error('Error creating vendor:', err);
    if (err.code === 11000) {
      if (err.message && err.message.includes('vendorCode')) {
        try {
          const fallbackCode = `VEN-${Date.now().toString().slice(-6)}`;
          const retryVendor = await VendorMaster.create({
            vendorCode: fallbackCode,
            vendorName: nameTrimmed,
            vendorNameNormalized: normName,
            address: address ? address.trim() : '',
            city: city ? city.trim() : '',
            pincode: pincode ? pincode.trim() : '',
            gstin: gstin ? gstin.trim().toUpperCase() : '',
            panCard: panCard ? panCard.trim().toUpperCase() : '',
            status: status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
            createdBy: req.body.createdBy || 'Admin'
          });
          return res.status(201).json({
            success: true,
            message: 'Vendor created successfully.',
            data: retryVendor
          });
        } catch (retryErr) {
          return res.status(400).json({ success: false, message: 'This vendor already exists.' });
        }
      }
      return res.status(400).json({ success: false, message: 'This vendor already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create vendor.' });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorName, address, city, pincode, gstin, panCard, status } = req.body;

    const vendor = await VendorMaster.findById(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor master record not found.' });
    }

    const oldVal = vendor.toObject();

    if (vendorName !== undefined) {
      if (!vendorName.trim()) {
        return res.status(400).json({ success: false, message: 'Vendor name is required.' });
      }
      vendor.vendorName = vendorName.trim();
      vendor.vendorNameNormalized = normalizeString(vendorName);
    }

    if (address !== undefined) vendor.address = address ? address.trim() : '';
    if (city !== undefined) vendor.city = city ? city.trim() : '';
    if (pincode !== undefined) vendor.pincode = pincode ? pincode.trim() : '';
    if (gstin !== undefined) vendor.gstin = gstin ? gstin.trim().toUpperCase() : '';
    if (panCard !== undefined) vendor.panCard = panCard ? panCard.trim().toUpperCase() : '';

    if (status !== undefined) {
      vendor.status = status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    }

    vendor.updatedBy = req.body.updatedBy || 'Admin';

    // Duplicate check
    const duplicate = await VendorMaster.findOne({
      _id: { $ne: id },
      vendorNameNormalized: vendor.vendorNameNormalized
    });

    if (duplicate) {
      return res.status(400).json({ 
        success: false, 
        message: `Vendor "${duplicate.vendorName}" (${duplicate.vendorCode}) already exists.` 
      });
    }

    await vendor.save();

    await MasterDataAudit.create({
      entityType: 'VENDOR',
      entityId: vendor._id,
      action: 'UPDATED',
      performedBy: req.body.updatedBy || 'Admin',
      oldValue: oldVal,
      newValue: vendor.toObject()
    });

    res.json({
      success: true,
      message: 'Vendor updated successfully.',
      data: vendor
    });
  } catch (err) {
    console.error('Error updating vendor:', err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'This vendor already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to update vendor.' });
  }
};

exports.updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const newStatus = (status || '').toUpperCase();
    if (!['ACTIVE', 'INACTIVE'].includes(newStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const vendor = await VendorMaster.findById(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor master record not found.' });
    }

    const oldVal = vendor.toObject();
    vendor.status = newStatus;
    vendor.updatedBy = req.body.updatedBy || 'Admin';
    await vendor.save();

    await MasterDataAudit.create({
      entityType: 'VENDOR',
      entityId: vendor._id,
      action: newStatus === 'ACTIVE' ? 'ACTIVATED' : 'DEACTIVATED',
      performedBy: req.body.updatedBy || 'Admin',
      oldValue: oldVal,
      newValue: vendor.toObject()
    });

    res.json({
      success: true,
      message: `Vendor ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`,
      data: vendor
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update vendor status.' });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await VendorMaster.findById(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor master record not found.' });
    }

    // Check usage in GatePass companyName/vendorId or MaterialInward partyName/vendorId
    const [gpCount, miCount] = await Promise.all([
      GatePass.countDocuments({
        $or: [
          { vendorId: id },
          { companyName: vendor.vendorName }
        ]
      }),
      MaterialInward.countDocuments({
        $or: [
          { vendorId: id },
          { partyName: vendor.vendorName }
        ]
      })
    ]);

    if (gpCount > 0 || miCount > 0) {
      return res.status(400).json({
        success: false,
        isReferenced: true,
        message: 'This vendor is already used in existing transactions and cannot be deleted. Deactivate it instead.'
      });
    }

    const oldVal = vendor.toObject();
    await VendorMaster.findByIdAndDelete(id);

    await MasterDataAudit.create({
      entityType: 'VENDOR',
      entityId: id,
      action: 'DELETED',
      performedBy: req.body.performedBy || 'Admin',
      oldValue: oldVal
    });

    res.json({
      success: true,
      message: 'Vendor deleted successfully.'
    });
  } catch (err) {
    console.error('Error deleting vendor:', err);
    res.status(500).json({ success: false, message: 'Failed to delete vendor.' });
  }
};

exports.getAuditHistory = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const history = await MasterDataAudit.find({
      entityType: entityType.toUpperCase(),
      entityId
    }).sort({ performedAt: -1 }).limit(50);

    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error loading audit history.' });
  }
};

exports.exportItemsExcel = async (req, res) => {
  try {
    const { search = '', status = 'ALL' } = req.query;
    const query = {};
    if (status && status.toUpperCase() !== 'ALL') {
      query.status = status.toUpperCase();
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ description: regex }, { um: regex }, { itemCode: regex }];
    }

    const items = await ItemMaster.find(query).sort({ itemCode: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Item Master Data');

    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'MARUTI NANDAN DENIM PVT LTD — ITEM DESCRIPTION MASTER REPORT';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    sheet.addRow([]);
    sheet.addRow(['Report Period:', `Generated on ${format(new Date(), 'dd-MM-yyyy HH:mm')}`]);
    sheet.addRow(['Total Items:', items.length]);
    sheet.addRow([]);

    const headerRow = sheet.addRow(['Sr. No.', 'Item Code', 'Item Description', 'Unit of Measurement (UM)', 'Status', 'Created Date']);
    headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle' };
    });
    headerRow.height = 24;

    items.forEach((item, idx) => {
      sheet.addRow([
        idx + 1,
        item.itemCode || '-',
        item.description,
        item.um,
        item.status,
        item.createdAt ? format(new Date(item.createdAt), 'dd-MM-yyyy') : '-'
      ]);
    });

    sheet.columns = [
      { width: 8 },
      { width: 14 },
      { width: 45 },
      { width: 25 },
      { width: 12 },
      { width: 16 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="MarutiDenim_Item_Master_Report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error exporting items excel:', err);
    res.status(500).json({ success: false, message: 'Failed to export Excel report.' });
  }
};

exports.exportVendorsExcel = async (req, res) => {
  try {
    const { search = '', status = 'ALL' } = req.query;
    const query = {};
    if (status && status.toUpperCase() !== 'ALL') {
      query.status = status.toUpperCase();
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ vendorName: regex }, { vendorCode: regex }];
    }

    const vendors = await VendorMaster.find(query).sort({ vendorCode: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Vendor Master Data');

    sheet.mergeCells('A1:J1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'MARUTI NANDAN DENIM PVT LTD — VENDOR MASTER REPORT';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    sheet.addRow([]);
    sheet.addRow(['Report Period:', `Generated on ${format(new Date(), 'dd-MM-yyyy HH:mm')}`]);
    sheet.addRow(['Total Vendors:', vendors.length]);
    sheet.addRow([]);

    const headerRow = sheet.addRow(['Sr. No.', 'Vendor Code', 'Vendor Name / Company Name', 'Address', 'City', 'Pincode', 'GSTIN', 'PAN Card', 'Status', 'Created Date']);
    headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle' };
    });
    headerRow.height = 24;

    vendors.forEach((vendor, idx) => {
      sheet.addRow([
        idx + 1,
        vendor.vendorCode || '-',
        vendor.vendorName,
        vendor.address || '-',
        vendor.city || '-',
        vendor.pincode || '-',
        vendor.gstin || '-',
        vendor.panCard || '-',
        vendor.status,
        vendor.createdAt ? format(new Date(vendor.createdAt), 'dd-MM-yyyy') : '-'
      ]);
    });

    sheet.columns = [
      { width: 8 },
      { width: 14 },
      { width: 35 },
      { width: 30 },
      { width: 18 },
      { width: 12 },
      { width: 18 },
      { width: 16 },
      { width: 12 },
      { width: 16 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="MarutiDenim_Vendor_Master_Report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error exporting vendors excel:', err);
    res.status(500).json({ success: false, message: 'Failed to export Excel report.' });
  }
};

const { generatePdfFromUrl } = require('../services/pdfService');

exports.downloadMasterDataPdf = async (req, res) => {
  try {
    const { type = 'items', search = '', status = 'ALL' } = req.query;

    const queryParams = new URLSearchParams({
      type,
      search,
      status,
      autoprint: 'false'
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const printUrl = `${clientUrl}/documents/master-data/print?${queryParams.toString()}`;

    const pdfBuffer = await generatePdfFromUrl(printUrl);

    const titleStr = type === 'items' ? 'Item_Master' : 'Vendor_Master';
    const filename = `MarutiDenim_${titleStr}_Report.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download Master Data PDF Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Master Data PDF', error: error.message });
  }
};
