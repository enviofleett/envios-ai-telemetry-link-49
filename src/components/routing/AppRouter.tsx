
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
import AnalyticsDashboard from '@/pages/AnalyticsDashboard';
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

// Operations
import Maintenance from '@/pages/Maintenance';
import WorkshopManagement from '@/pages/WorkshopManagement';
import Marketplace from '@/pages/Marketplace';

// Analytics & Reports
import Reports from '@/pages/Reports';
import AdminAnalytics from '@/pages/AdminAnalytics';

// Business Management
import PackageManagement from '@/pages/PackageManagement';
import ActiveServices from '@/pages/ActiveServices';
import MerchantApplication from '@/pages/MerchantApplication';
import ReferralAgents from '@/pages/ReferralAgents';

// GP51 Integration Page
import GP51IntegrationPage from '@/pages/GP51IntegrationPage';

// GPS51 Pages - FIXED ROUTES
import GPS51Dashboard from '@/pages/GPS51Dashboard';
import GPS51LiveTracking from '@/pages/GPS51LiveTracking';
import GPS51DeviceManagement from '@/pages/GPS51DeviceManagement';
import GPS51TripHistory from '@/pages/GPS51TripHistory';
import GPS51RouteAnalytics from '@/pages/GPS51RouteAnalytics';
import GPS51Geofencing from '@/pages/GPS51Geofencing';
import GPS51Reports from '@/pages/GPS51Reports';
import GPS51IntegrationPage from '@/components/gps51/GPS51IntegrationPage';

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

      <Route 
        path="/analytics-dashboard" 
        element={
          <ProtectedRoute>
            <Layout>
              <AnalyticsDashboard />
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
      
      {/* GP51 Integration Route */}
      <Route
        path="/gp51-integration"
        element={
          <ProtectedRoute>
            <Layout>
              <GP51IntegrationPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* GPS51 Routes - RESTRUCTURED */}
      <Route
        path="/gps51"
        element={
          <ProtectedRoute>
            <Layout>
              <GPS51Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/gps51/setup"
        element={
          <ProtectedRoute>
            <Layout>
              <GPS51IntegrationPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/gps51/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <GPS51Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/gps51/tracking"
        element={
          <ProtectedRoute>
            <Layout>
              <GPS51LiveTracking />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/gps51/devices"
        element={
          <ProtectedRoute>
            <Layout>
              <GPS51DeviceManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/gps51/history"
        element={
          <ProtectedRoute>
            <Layout>
              <GPS51TripHistory />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/gps51/analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <GPS51RouteAnalytics />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/gps51/geofences"
        element={
          <ProtectedRoute>
            <Layout>
              <GPS51Geofencing />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/gps51/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <GPS51Reports />
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
