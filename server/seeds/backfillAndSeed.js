const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ItemMaster = require('../models/ItemMaster');
const VendorMaster = require('../models/VendorMaster');
const GatePass = require('../models/GatePass');
const MaterialInward = require('../models/MaterialInward');
const MasterDataAudit = require('../models/MasterDataAudit');

const isDryRun = process.argv.includes('--dry-run');

const normalizeString = (str) => {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/\s+/g, ' ');
};

async function generateNextItemCode(currentCount) {
  return `ITEM-${String(currentCount + 1).padStart(4, '0')}`;
}

async function generateNextVendorCode(currentCount) {
  return `VEN-${String(currentCount + 1).padStart(4, '0')}`;
}

async function runSeedingAndBackfill() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maruti_denim';
    await mongoose.connect(mongoUri);
    console.log(`\n==================================================`);
    console.log(` MARUTI DENIM MASTER DATA SEED & BACKFILL SCRIPT`);
    console.log(` Mode: ${isDryRun ? 'DRY-RUN (No DB Writes)' : 'LIVE EXECUTION'}`);
    console.log(`==================================================\n`);

    // ----------------------------------------------------
    // SECTION 1: SEED ITEM DESCRIPTION MASTER
    // ----------------------------------------------------
    console.log('--- SECTION 1: SEEDING ITEM DESCRIPTION MASTER ---');
    const seedFilePath = path.join(__dirname, 'data/itemMaster.seed.json');
    let seedItems = [];
    if (fs.existsSync(seedFilePath)) {
      seedItems = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));
    }

    let itemStats = {
      totalInFile: seedItems.length,
      inserted: 0,
      skipped: 0,
      duplicatesInFile: 0,
      rejected: []
    };

    const seenItemKeysInFile = new Set();
    let existingItemCount = await ItemMaster.countDocuments();

    for (const item of seedItems) {
      const description = (item.description || '').trim();
      const um = (item.uom || item.um || 'Nos').trim();

      if (!description) {
        itemStats.rejected.push({ row: item, reason: 'Missing item description' });
        continue;
      }

      if (!um) {
        itemStats.rejected.push({ row: item, reason: 'Missing unit of measurement (UM)' });
        continue;
      }

      const normalizedDesc = normalizeString(description);
      const dedupeKey = `${normalizedDesc}___${normalizeString(um)}`;

      if (seenItemKeysInFile.has(dedupeKey)) {
        itemStats.duplicatesInFile++;
        continue;
      }
      seenItemKeysInFile.add(dedupeKey);

      // Check if already in DB
      const existing = await ItemMaster.findOne({ descriptionNormalized: normalizedDesc, um });
      if (existing) {
        itemStats.skipped++;
      } else {
        if (!isDryRun) {
          existingItemCount++;
          const itemCode = await generateNextItemCode(existingItemCount);
          const newItem = await ItemMaster.create({
            itemCode,
            description,
            descriptionNormalized: normalizedDesc,
            um,
            status: 'ACTIVE',
            createdBy: 'System (Seed)',
            updatedBy: 'System (Seed)'
          });

          await MasterDataAudit.create({
            entityType: 'ITEM',
            entityId: newItem._id,
            action: 'IMPORTED',
            performedBy: 'System (Seed)',
            newValue: newItem.toObject(),
            reason: 'Initial Seed Migration'
          });
        }
        itemStats.inserted++;
      }
    }

    // Also check existing GatePass & MaterialInward items to make sure all existing transactional items are in ItemMaster
    const gatePasses = await GatePass.find({});
    const materialInwards = await MaterialInward.find({});

    for (const gp of gatePasses) {
      for (const it of gp.items || []) {
        if (!it.description) continue;
        const normDesc = normalizeString(it.description);
        const um = (it.uom || 'Nos').trim();
        const existing = await ItemMaster.findOne({ descriptionNormalized: normDesc, um });
        if (!existing) {
          if (!isDryRun) {
            existingItemCount++;
            const itemCode = await generateNextItemCode(existingItemCount);
            const newItem = await ItemMaster.create({
              itemCode,
              description: it.description.trim(),
              descriptionNormalized: normDesc,
              um,
              status: 'ACTIVE',
              createdBy: 'System (Txn Backfill)'
            });
            itemStats.inserted++;
          }
        }
      }
    }

    console.log(`Item Seeding Summary:`);
    console.log(`  - Total rows in seed file: ${itemStats.totalInFile}`);
    console.log(`  - Inserted new items:      ${itemStats.inserted}`);
    console.log(`  - Skipped (already exist):  ${itemStats.skipped}`);
    console.log(`  - Duplicates within file:   ${itemStats.duplicatesInFile}`);
    console.log(`  - Rejected rows:            ${itemStats.rejected.length}`);
    if (itemStats.rejected.length > 0) {
      console.log(`  - Rejected details:`, itemStats.rejected);
    }

    // ----------------------------------------------------
    // SECTION 2: BACKFILL VENDOR / COMPANY MASTER
    // ----------------------------------------------------
    console.log('\n--- SECTION 2: BACKFILLING VENDOR MASTER ---');
    const vendorMap = new Map(); // normalizedName -> rawName
    const rawVendorNames = [];

    gatePasses.forEach(gp => {
      if (gp.companyName && gp.companyName.trim()) {
        rawVendorNames.push(gp.companyName.trim());
      }
    });

    materialInwards.forEach(mi => {
      if (mi.partyName && mi.partyName.trim()) {
        rawVendorNames.push(mi.partyName.trim());
      }
    });

    rawVendorNames.forEach(rawName => {
      const norm = normalizeString(rawName);
      if (norm && !vendorMap.has(norm)) {
        vendorMap.set(norm, rawName);
      }
    });

    let vendorStats = {
      distinctNamesFound: vendorMap.size,
      vendorsCreated: 0,
      vendorsSkipped: 0,
      nearDuplicatesFlagged: []
    };

    // Flag near-duplicates (e.g. ignoring punctuation)
    const simpleMap = new Map();
    vendorMap.forEach((rawName, normName) => {
      const stripped = normName.replace(/[^a-z0-9]/g, '');
      if (simpleMap.has(stripped) && simpleMap.get(stripped) !== rawName) {
        vendorStats.nearDuplicatesFlagged.push({
          nameA: simpleMap.get(stripped),
          nameB: rawName
        });
      } else {
        simpleMap.set(stripped, rawName);
      }
    });

    let existingVendorCount = await VendorMaster.countDocuments();

    for (const [normName, rawName] of vendorMap.entries()) {
      let vendor = await VendorMaster.findOne({ vendorNameNormalized: normName });
      if (vendor) {
        vendorStats.vendorsSkipped++;
      } else {
        if (!isDryRun) {
          existingVendorCount++;
          const vendorCode = await generateNextVendorCode(existingVendorCount);
          vendor = await VendorMaster.create({
            vendorCode,
            vendorName: rawName,
            vendorNameNormalized: normName,
            status: 'ACTIVE',
            createdBy: 'System (Backfill)'
          });

          await MasterDataAudit.create({
            entityType: 'VENDOR',
            entityId: vendor._id,
            action: 'CREATED',
            performedBy: 'System (Backfill)',
            newValue: vendor.toObject(),
            reason: 'Backfill Migration from GatePass/MaterialInward'
          });
        }
        vendorStats.vendorsCreated++;
      }
    }

    console.log(`Vendor Backfill Summary:`);
    console.log(`  - Distinct vendor names found: ${vendorStats.distinctNamesFound}`);
    console.log(`  - Vendors created:             ${vendorStats.vendorsCreated}`);
    console.log(`  - Vendors skipped (existed):   ${vendorStats.vendorsSkipped}`);
    console.log(`  - Near-duplicates flagged:      ${vendorStats.nearDuplicatesFlagged.length}`);
    if (vendorStats.nearDuplicatesFlagged.length > 0) {
      console.log(`  - Flagged near-duplicates:`, vendorStats.nearDuplicatesFlagged);
    }

    // ----------------------------------------------------
    // SECTION 3: LINK TRANSACTION RECORDS TO MASTERS (SNAPSHOT RULE PRESERVED)
    // ----------------------------------------------------
    console.log('\n--- SECTION 3: LINKING TRANSACTIONS TO VENDOR & ITEM MASTERS ---');
    let updatedGatePasses = 0;
    let updatedMaterialInwards = 0;

    const allVendors = await VendorMaster.find({});
    const vendorLookup = new Map();
    allVendors.forEach(v => vendorLookup.set(v.vendorNameNormalized, v._id));

    const allItems = await ItemMaster.find({});
    const itemLookup = new Map();
    allItems.forEach(i => itemLookup.set(`${i.descriptionNormalized}___${normalizeString(i.um)}`, i._id));

    if (!isDryRun) {
      for (const gp of gatePasses) {
        let modified = false;
        if (gp.companyName) {
          const vId = vendorLookup.get(normalizeString(gp.companyName));
          if (vId && (!gp.vendorId || String(gp.vendorId) !== String(vId))) {
            gp.vendorId = vId;
            modified = true;
          }
        }

        if (gp.items && gp.items.length > 0) {
          gp.items.forEach(it => {
            if (it.description) {
              const key = `${normalizeString(it.description)}___${normalizeString(it.uom || 'Nos')}`;
              const iId = itemLookup.get(key);
              if (iId && (!it.itemId || String(it.itemId) !== String(iId))) {
                it.itemId = iId;
                modified = true;
              }
            }
          });
        }

        if (modified) {
          await gp.save();
          updatedGatePasses++;
        }
      }

      for (const mi of materialInwards) {
        let modified = false;
        if (mi.partyName) {
          const vId = vendorLookup.get(normalizeString(mi.partyName));
          if (vId && (!mi.vendorId || String(mi.vendorId) !== String(vId))) {
            mi.vendorId = vId;
            modified = true;
          }
        }

        if (mi.items && mi.items.length > 0) {
          mi.items.forEach(it => {
            if (it.description) {
              const key = `${normalizeString(it.description)}___${normalizeString(it.unit || 'Nos')}`;
              const iId = itemLookup.get(key);
              if (iId && (!it.itemId || String(it.itemId) !== String(iId))) {
                it.itemId = iId;
                modified = true;
              }
            }
          });
        }

        if (modified) {
          await mi.save();
          updatedMaterialInwards++;
        }
      }
    }

    console.log(`Transaction Linking Summary:`);
    console.log(`  - Gate Passes linked:     ${updatedGatePasses}`);
    console.log(`  - Material Inwards linked: ${updatedMaterialInwards}`);

    console.log(`\n==================================================`);
    console.log(` MASTER DATA SEED & BACKFILL COMPLETED SUCCESSFULLY`);
    console.log(`==================================================\n`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runSeedingAndBackfill();
