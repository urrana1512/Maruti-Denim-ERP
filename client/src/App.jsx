import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import AddGatePass from './pages/GatePass/AddGatePass';
import ManageGatePass from './pages/GatePass/ManageGatePass';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/gate-pass/manage" replace />} />
          <Route path="gate-pass/add" element={<AddGatePass />} />
          <Route path="gate-pass/manage" element={<ManageGatePass />} />
          <Route path="gate-pass/:id" element={<div className="p-6">View Gate Pass (To Be Implemented)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
