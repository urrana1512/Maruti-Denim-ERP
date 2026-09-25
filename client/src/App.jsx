import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import AddGatePass from './pages/GatePass/AddGatePass';
import ManageGatePass from './pages/GatePass/ManageGatePass';
import MaterialInward from './pages/MaterialInward/MaterialInward';
import Reports from './pages/Reports/Reports';

import GatePassPrintView from './pages/Documents/GatePassPrintView';
import MaterialInwardPrintView from './pages/Documents/MaterialInwardPrintView';
import CorporateReportPrintView from './pages/Documents/CorporateReportPrintView';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/gate-pass/manage" replace />} />
          <Route path="gate-pass/add" element={<AddGatePass />} />
          <Route path="gate-pass/manage" element={<ManageGatePass />} />
          <Route path="manage-gatepass" element={<Navigate to="/gate-pass/manage" replace />} />
          <Route path="material-inward" element={<MaterialInward />} />
          <Route path="reports" element={<Reports />} />
          <Route path="gate-pass/:id" element={<div className="p-6">View Gate Pass</div>} />
        </Route>

        {/* Print-Only standalone document routes (no layout chrome) */}
        <Route path="/documents/gate-pass/:id/print" element={<GatePassPrintView />} />
        <Route path="/documents/material-inward/:id/print" element={<MaterialInwardPrintView />} />
        <Route path="/documents/reports/print" element={<CorporateReportPrintView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
