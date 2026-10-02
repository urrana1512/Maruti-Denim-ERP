import React, { useState } from 'react';
import ItemMasterPage from '../MasterData/ItemMasterPage';
import VendorMasterPage from '../MasterData/VendorMasterPage';
import { Layers, Building2 } from 'lucide-react';

const AdminMasterDataPage = () => {
  const [activeTab, setActiveTab] = useState('items');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Master Data Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Control material descriptions, units of measure, vendors, and party details</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 bg-white px-4 pt-3 rounded-t-2xl shadow-sm">
        <button
          onClick={() => setActiveTab('items')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'items'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={16} /> Item Descriptions Master
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'vendors'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 size={16} /> Vendor & Company Master
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-b-2xl border border-t-0 border-slate-200 shadow-sm">
        {activeTab === 'items' ? <ItemMasterPage /> : <VendorMasterPage />}
      </div>
    </div>
  );
};

export default AdminMasterDataPage;
