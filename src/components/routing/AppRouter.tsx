
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

// Public Pages
import Login from '@/pages/Login';
import Auth from '@/pages/Auth';
import AdminLogin from '@/pages/AdminLogin';

// Protected Pages - Dashboard
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import AdminSetup from '@/pages/AdminSetup';

// Core Fleet Management
import EnhancedLiveTracking from '@/pages/EnhancedLiveTracking';
import EnhancedVehicleManagement from '@/pages/EnhancedVehicleManagement';
import UserVehicles from '@/pages/UserVehicles';
import EnhancedUserManagement from '@/pages/EnhancedUserManagement';

// System Management
import StableAdminSettings from '@/pages/StableAdminSettings';
import SystemImport from '@/pages/SystemImport';
import DeviceConfiguration from '@/pages/DeviceConfiguration';

// Operations - Now with full functionality
import Maintenance from '@/pages/Maintenance';
import WorkshopManagement from '@/pages/WorkshopManagement';
import Marketplace from '@/pages/Marketplace';

// Analytics & Reports
import Reports from '@/pages/Reports';
import AdminAnalytics from '@/pages/AdminAnalytics';

// Business Management - Now with full functionality
import PackageManagement from '@/pages/PackageManagement';
import ActiveServices from '@/pages/ActiveServices';
import MerchantApplication from '@/pages/MerchantApplication';
import ReferralAgents from '@/pages/ReferralAgents';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      
      {/* Protected routes with Layout */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout>
              <Index />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* Core Fleet Management */}
      <Route
        path="/tracking"
        element={
          <ProtectedRoute>
            <Layout>
              <EnhancedLiveTracking />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <Layout>
              <EnhancedVehicleManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-vehicles"
        element={
          <ProtectedRoute>
            <Layout>
              <UserVehicles />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <EnhancedUserManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* System Management */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <StableAdminSettings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-setup"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminSetup />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/system-import"
        element={
          <ProtectedRoute>
            <Layout>
              <SystemImport />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/device-configuration"
        element={
          <ProtectedRoute>
            <Layout>
              <DeviceConfiguration />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Enhanced Operations */}
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <Layout>
              <Maintenance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workshop-management"
        element={
          <ProtectedRoute>
            <Layout>
              <WorkshopManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketplace"
        element={
          <ProtectedRoute>
            <Layout>
              <Marketplace />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Analytics & Reports */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminAnalytics />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Enhanced Business Management */}
      <Route
        path="/packages"
        element={
          <ProtectedRoute>
            <Layout>
              <PackageManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <Layout>
              <ActiveServices />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant-application"
        element={
          <ProtectedRoute>
            <Layout>
              <MerchantApplication />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/referral-agents"
        element={
          <ProtectedRoute>
            <Layout>
              <ReferralAgents />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Redirect any unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
