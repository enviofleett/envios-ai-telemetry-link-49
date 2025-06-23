
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';

// Pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import VehicleManagement from '@/pages/VehicleManagement';
import UserManagement from '@/pages/UserManagement';
import Marketplace from '@/pages/Marketplace';
import PackageManagement from '@/pages/PackageManagement';
import AdminSettings from '@/pages/AdminSettings';

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
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Index />} />
                <Route path="/vehicles" element={<VehicleManagement />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/packages" element={<PackageManagement />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminSettings />
                    </ProtectedRoute>
                  } 
                />
                {/* Redirect any unknown routes to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
