const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });

const GatePass = require('../server/models/GatePass');
const MaterialInward = require('../server/models/MaterialInward');

async function inspectDb() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maruti_denim';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    const gatePasses = await GatePass.find({});
    console.log('Total Gate Passes:', gatePasses.length);

    const materialInwards = await MaterialInward.find({});
    console.log('Total Material Inwards:', materialInwards.length);

    const companies = new Set();
    const items = new Set();

    gatePasses.forEach(gp => {
      if (gp.companyName) companies.add(gp.companyName.trim());
      gp.items?.forEach(it => {
        if (it.description) items.add(`${it.description.trim()} | ${it.uom || 'Nos'}`);
      });
    });

    materialInwards.forEach(mi => {
      if (mi.partyName) companies.add(mi.partyName.trim());
      mi.items?.forEach(it => {
        if (it.description) items.add(`${it.description.trim()} | ${it.uom || 'Nos'}`);
      });
    });

    console.log('\n--- Distinct Vendors / Companies Found ---');
    console.log(Array.from(companies));

    console.log('\n--- Distinct Items Found ---');
    console.log(Array.from(items));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Inspect DB error:', err);
  }
}

inspectDb();
