const mongoose = require('mongoose');
const GatePass = require('../models/GatePass');

// Mock data store
let mockGatePasses = [];
let mockCounter = 0;

const isDbConnected = () => mongoose.connection.readyState === 1;

const generateGatePassNumber = async (peekOnly = false) => {
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
    const nextNum = peekOnly ? mockCounter + 1 : ++mockCounter;
    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
  }
};

const getNextGatePassNumber = async () => {
  return await generateGatePassNumber(true);
};

const combineDateWithCurrentTime = (dateInput) => {
  const now = new Date();
  if (!dateInput) return now;
  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const parts = dateInput.split('T')[0].split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const d = new Date();
      d.setFullYear(parts[0], parts[1] - 1, parts[2]);
      return d;
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return now;
  d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return d;
};

const createGatePass = async (data) => {
  const gatePassNumber = data.gatePassNumber || await generateGatePassNumber();
  const finalDate = combineDateWithCurrentTime(data.date);
  const items = (data.items || []).map((item, idx) => ({
    ...item,
    serialNumber: item.serialNumber || idx + 1
  }));
  const payload = { ...data, date: finalDate, gatePassNumber, items };

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
  const { search, passType, status, startDate, endDate } = query;

  if (isDbConnected()) {
    let dbQuery = {};
    
    if (search) {
      dbQuery.$or = [
        { gatePassNumber: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { 'items.description': { $regex: search, $options: 'i' } }
      ];
    }

    if (passType && passType !== 'All') {
      dbQuery.passType = passType;
    }

    if (status && status !== 'All') {
      dbQuery.status = status;
    }

    if (startDate || endDate) {
      dbQuery.date = {};
      if (startDate) dbQuery.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dbQuery.date.$lte = end;
      }
    }

    return await GatePass.find(dbQuery).sort({ createdAt: -1 });
  } else {
    let results = [...mockGatePasses];
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(gp => 
        gp.gatePassNumber.toLowerCase().includes(s) || 
        gp.companyName.toLowerCase().includes(s) ||
        gp.items.some(item => item.description.toLowerCase().includes(s))
      );
    }

    if (passType && passType !== 'All') {
      results = results.filter(gp => gp.passType === passType);
    }

    if (status && status !== 'All') {
      results = results.filter(gp => gp.status === status);
    }

    if (startDate) {
      const start = new Date(startDate);
      results = results.filter(gp => new Date(gp.date) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      results = results.filter(gp => new Date(gp.date) <= end);
    }

    return results.sort((a, b) => b.createdAt - a.createdAt);
  }
};

const getGatePassById = async (id) => {
  if (!id) return null;
  if (isDbConnected()) {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const found = await GatePass.findById(id);
      if (found) return found;
    }
    const foundByNum = await GatePass.findOne({ gatePassNumber: id });
    if (foundByNum) return foundByNum;
  }
  return mockGatePasses.find(gp => gp._id === id || gp.gatePassNumber === id);
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
  deleteGatePass,
  getNextGatePassNumber
};
