import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import SuperAdminRoute from './components/auth/SuperAdminRoute';

import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';
import SuperAdminLayout from './components/superadmin/SuperAdminLayout';

// Auth Pages
import LoginPage from './pages/Auth/LoginPage';
import AdminLoginPage from './pages/Auth/AdminLoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';

// Super Admin Pages
import SuperAdminLoginPage from './pages/SuperAdmin/SuperAdminLoginPage';
import SuperAdminDashboardPage from './pages/SuperAdmin/SuperAdminDashboardPage';
import SuperAdminCompaniesPage from './pages/SuperAdmin/SuperAdminCompaniesPage';
import SuperAdminCompanyDetailPage from './pages/SuperAdmin/SuperAdminCompanyDetailPage';
import SuperAdminGatePassesPage from './pages/SuperAdmin/SuperAdminGatePassesPage';
import SuperAdminInwardPage from './pages/SuperAdmin/SuperAdminInwardPage';
import SuperAdminUsersPage from './pages/SuperAdmin/SuperAdminUsersPage';
import SuperAdminCompanyAdminsPage from './pages/SuperAdmin/SuperAdminCompanyAdminsPage';
import SuperAdminReportsPage from './pages/SuperAdmin/SuperAdminReportsPage';
import SuperAdminAuditLogsPage from './pages/SuperAdmin/SuperAdminAuditLogsPage';
import SuperAdminAlertsPage from './pages/SuperAdmin/SuperAdminAlertsPage';
import SuperAdminSettingsPage from './pages/SuperAdmin/SuperAdminSettingsPage';

// User Module Pages
import DashboardPage from './pages/Dashboard/DashboardPage';
import AddGatePass from './pages/GatePass/AddGatePass';
import ManageGatePass from './pages/GatePass/ManageGatePass';
import MaterialInward from './pages/MaterialInward/MaterialInward';
import Reports from './pages/Reports/Reports';
import ItemMasterPage from './pages/MasterData/ItemMasterPage';
import VendorMasterPage from './pages/MasterData/VendorMasterPage';

// Admin Panel Pages
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import AdminUsersPage from './pages/Admin/AdminUsersPage';
import AdminRolesPage from './pages/Admin/AdminRolesPage';
import AdminGatePassesPage from './pages/Admin/AdminGatePassesPage';
import AdminReturnablePage from './pages/Admin/AdminReturnablePage';
import AdminMasterDataPage from './pages/Admin/AdminMasterDataPage';
import AdminReportsPage from './pages/Admin/AdminReportsPage';
import AdminAuditLogsPage from './pages/Admin/AdminAuditLogsPage';

// Document Print Pages
import GatePassPrintView from './pages/Documents/GatePassPrintView';
import MaterialInwardPrintView from './pages/Documents/MaterialInwardPrintView';
import CorporateReportPrintView from './pages/Documents/CorporateReportPrintView';
import MasterDataPrintView from './pages/Documents/MasterDataPrintView';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/select-company" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Super Admin Public Login */}
          <Route path="/superadmin/login" element={<SuperAdminLoginPage />} />

          {/* Super Admin Protected Panel Routes */}
          <Route
            path="/superadmin"
            element={
              <SuperAdminRoute>
                <SuperAdminLayout />
              </SuperAdminRoute>
            }
          >
            <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboardPage />} />
            <Route path="companies" element={<SuperAdminCompaniesPage />} />
            <Route path="companies/:code/details" element={<SuperAdminCompanyDetailPage />} />
            <Route path="gate-passes" element={<SuperAdminGatePassesPage />} />
            <Route path="inward-returnables" element={<SuperAdminInwardPage />} />
            <Route path="users" element={<SuperAdminUsersPage />} />
            <Route path="company-admins" element={<SuperAdminCompanyAdminsPage />} />
            <Route path="reports" element={<SuperAdminReportsPage />} />
            <Route path="audit-logs" element={<SuperAdminAuditLogsPage />} />
            <Route path="alerts" element={<SuperAdminAlertsPage />} />
            <Route path="settings" element={<SuperAdminSettingsPage />} />
          </Route>

          {/* Standard User Operational Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route
              path="gate-pass/add"
              element={
                <ProtectedRoute requiredPermission="gate_pass_create">
                  <AddGatePass />
                </ProtectedRoute>
              }
            />
            <Route
              path="gate-pass/manage"
              element={
                <ProtectedRoute requiredPermission="gate_pass_read">
                  <ManageGatePass />
                </ProtectedRoute>
              }
            />
            <Route path="manage-gatepass" element={<Navigate to="/gate-pass/manage" replace />} />
            <Route
              path="material-inward"
              element={
                <ProtectedRoute requiredPermission="material_inward_read">
                  <MaterialInward />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute requiredPermission="reports_view">
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* Master Data Routes */}
            <Route
              path="master-data/items"
              element={
                <ProtectedRoute requiredPermission="master_data_read">
                  <ItemMasterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="master-data/vendors"
              element={
                <ProtectedRoute requiredPermission="master_data_read">
                  <VendorMasterPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin Panel Protected Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="roles" element={<AdminRolesPage />} />
            <Route path="gate-passes" element={<AdminGatePassesPage />} />
            <Route path="returnable-materials" element={<AdminReturnablePage />} />
            <Route path="master-data" element={<AdminMasterDataPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          </Route>

          {/* Print-Only standalone document routes (no layout chrome) */}
          <Route path="/documents/gate-pass/:id/print" element={<GatePassPrintView />} />
          <Route path="/documents/material-inward/:id/print" element={<MaterialInwardPrintView />} />
          <Route path="/documents/reports/print" element={<CorporateReportPrintView />} />
          <Route path="/documents/master-data/print" element={<MasterDataPrintView />} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
