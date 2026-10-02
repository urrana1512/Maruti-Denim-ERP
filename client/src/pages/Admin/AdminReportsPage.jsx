import React from 'react';
import Reports from '../Reports/Reports';

const AdminReportsPage = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise MIS & Corporate Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">Generate, filter, and export company gate pass and material inward registers</p>
      </div>

      <Reports />
    </div>
  );
};

export default AdminReportsPage;
