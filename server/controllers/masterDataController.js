const ItemMaster = require('../models/ItemMaster');
const VendorMaster = require('../models/VendorMaster');
const MasterDataAudit = require('../models/MasterDataAudit');
const GatePass = require('../models/GatePass');
const MaterialInward = require('../models/MaterialInward');

const normalizeString = (str) => {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/\s+/g, ' ');
};

// Helper: Generate next Code
async function generateNextItemCode() {
  const count = await ItemMaster.countDocuments();
  return `ITEM-${String(count + 1).padStart(4, '0')}`;
}

async function generateNextVendorCode() {
  const count = await VendorMaster.countDocuments();
  return `VEN-${String(count + 1).padStart(4, '0')}`;
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

    // Duplicate check
    const existing = await ItemMaster.findOne({ descriptionNormalized: normDesc, um: umTrimmed });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'An item with this description and unit of measurement already exists.' 
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

    // Check duplicate if description or um changed
    const duplicate = await ItemMaster.findOne({
      _id: { $ne: id },
      descriptionNormalized: item.descriptionNormalized,
      um: item.um
    });

    if (duplicate) {
      return res.status(400).json({ 
        success: false, 
        message: 'An item with this description and unit of measurement already exists.' 
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
      .select('_id vendorCode vendorName')
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
    const { vendorName, status = 'ACTIVE' } = req.body;

    if (!vendorName || !vendorName.trim()) {
      return res.status(400).json({ success: false, message: 'Vendor name is required.' });
    }

    const nameTrimmed = vendorName.trim();
    const normName = normalizeString(nameTrimmed);

    const existing = await VendorMaster.findOne({ vendorNameNormalized: normName });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This vendor already exists.' });
    }

    const vendorCode = await generateNextVendorCode();

    const newVendor = await VendorMaster.create({
      vendorCode,
      vendorName: nameTrimmed,
      vendorNameNormalized: normName,
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
      return res.status(400).json({ success: false, message: 'This vendor already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create vendor.' });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorName, status } = req.body;

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
      return res.status(400).json({ success: false, message: 'This vendor already exists.' });
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
