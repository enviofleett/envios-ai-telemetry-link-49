
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';

// Pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import VehicleManagement from '@/pages/VehicleManagement';
import UserManagement from '@/pages/UserManagement';
import Marketplace from '@/pages/Marketplace';
import PackageManagement from '@/pages/PackageManagement';
import StableAdminSettings from '@/pages/StableAdminSettings';

// New restored pages
import LiveTracking from '@/pages/LiveTracking';
import UserVehicles from '@/pages/UserVehicles';
import Reports from '@/pages/Reports';
import Maintenance from '@/pages/Maintenance';
import WorkshopManagement from '@/pages/WorkshopManagement';
import ActiveServices from '@/pages/ActiveServices';
import Settings from '@/pages/Settings';

export const AppRouter: React.FC = () => {
  const { loading } = useUnifiedAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes with dashboard layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Index />} />
                <Route path="/vehicles" element={<VehicleManagement />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/packages" element={<PackageManagement />} />
                
                {/* Restored routes */}
                <Route path="/tracking" element={<LiveTracking />} />
                <Route path="/my-vehicles" element={<UserVehicles />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/workshop-management" element={<WorkshopManagement />} />
                <Route path="/services" element={<ActiveServices />} />
                <Route path="/settings" element={<Settings />} />
                
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <StableAdminSettings />
                    </ProtectedRoute>
                  } 
                />
                {/* Redirect any unknown routes to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
