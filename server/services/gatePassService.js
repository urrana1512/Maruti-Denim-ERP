const mongoose = require('mongoose');
const GatePass = require('../models/GatePass');

// Mock data store
let mockGatePasses = [
  {
    _id: 'mock-1',
    gatePassNumber: 'GP-2026-0001',
    date: new Date('2026-09-22T00:00:00.000Z'),
    companyName: 'Parv Electronics',
    passType: 'Returnable',
    items: [
      { serialNumber: 1, description: 'ETU Motor - 9200M', category: 'On Cost Repair (OCR)', quantity: 1, remarks: 'Repair' },
      { serialNumber: 2, description: 'WBS Card', category: 'Free Of Cost Repair (FOC)', quantity: 1, remarks: 'Repair' }
    ],
    status: 'active',
    createdBy: 'Admin',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
let mockCounter = 1;

const isDbConnected = () => mongoose.connection.readyState === 1;

const generateGatePassNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `GP-${year}-`;
  
  if (isDbConnected()) {
    const lastGatePass = await GatePass.findOne({ gatePassNumber: new RegExp(`^${prefix}`) })
      .sort({ createdAt: -1 })
      .exec();
    
    if (lastGatePass) {
      const lastNumber = parseInt(lastGatePass.gatePassNumber.split('-')[2], 10);
      return `${prefix}${(lastNumber + 1).toString().padStart(4, '0')}`;
    }
    return `${prefix}0001`;
  } else {
    mockCounter++;
    return `${prefix}${mockCounter.toString().padStart(4, '0')}`;
  }
};

const createGatePass = async (data) => {
  const gatePassNumber = await generateGatePassNumber();
  const items = (data.items || []).map((item, idx) => ({
    ...item,
    serialNumber: item.serialNumber || idx + 1
  }));
  const payload = { ...data, gatePassNumber, items };

  if (isDbConnected()) {
    const newGatePass = new GatePass(payload);
    return await newGatePass.save();
  } else {
    const newGatePass = { ...payload, _id: `mock-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
    mockGatePasses.push(newGatePass);
    return newGatePass;
  }
};

const getGatePasses = async (query = {}) => {
  if (isDbConnected()) {
    // simplified find
    const { search, ...filters } = query;
    let dbQuery = { ...filters };
    
    if (search) {
      dbQuery.$or = [
        { gatePassNumber: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { 'items.description': { $regex: search, $options: 'i' } }
      ];
    }
    return await GatePass.find(dbQuery).sort({ createdAt: -1 });
  } else {
    // mock filtering
    let results = [...mockGatePasses];
    if (query.search) {
      const search = query.search.toLowerCase();
      results = results.filter(gp => 
        gp.gatePassNumber.toLowerCase().includes(search) || 
        gp.companyName.toLowerCase().includes(search) ||
        gp.items.some(item => item.description.toLowerCase().includes(search))
      );
    }
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }
};

const getGatePassById = async (id) => {
  if (isDbConnected()) {
    return await GatePass.findById(id);
  } else {
    return mockGatePasses.find(gp => gp._id === id || gp.gatePassNumber === id);
  }
};

const updateGatePass = async (id, data) => {
  if (isDbConnected()) {
    // Prevent gatePassNumber from being updated
    delete data.gatePassNumber;
    return await GatePass.findByIdAndUpdate(id, data, { new: true });
  } else {
    const index = mockGatePasses.findIndex(gp => gp._id === id);
    if (index !== -1) {
      delete data.gatePassNumber;
      mockGatePasses[index] = { ...mockGatePasses[index], ...data, updatedAt: new Date() };
      return mockGatePasses[index];
    }
    return null;
  }
};

const deleteGatePass = async (id) => {
  if (isDbConnected()) {
    return await GatePass.findByIdAndDelete(id);
  } else {
    const index = mockGatePasses.findIndex(gp => gp._id === id);
    if (index !== -1) {
      const deleted = mockGatePasses[index];
      mockGatePasses.splice(index, 1);
      return deleted;
    }
    return null;
  }
};

module.exports = {
  createGatePass,
  getGatePasses,
  getGatePassById,
  updateGatePass,
  deleteGatePass
};
