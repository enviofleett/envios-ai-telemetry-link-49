
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

// Public Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import PublicRegistration from '@/pages/PublicRegistration';
import VerifyOTP from '@/pages/VerifyOTP';
import SetPassword from '@/pages/SetPassword';

// Protected Pages
import ProfessionalDashboard from '@/components/dashboard/ProfessionalDashboard';
import EnhancedLiveTracking from '@/pages/EnhancedLiveTracking';
import EnhancedVehicleManagement from '@/pages/EnhancedVehicleManagement';
import UserVehicles from '@/pages/UserVehicles';
import EnhancedUserManagement from '@/pages/EnhancedUserManagement';
import StableAdminSettings from '@/pages/StableAdminSettings';

// Additional pages
import SystemImport from '@/pages/SystemImport';
import DeviceConfiguration from '@/pages/DeviceConfiguration';
import Maintenance from '@/pages/Maintenance';
import WorkshopManagement from '@/pages/WorkshopManagement';
import Marketplace from '@/pages/Marketplace';
import Reports from '@/pages/Reports';
import AdminAnalytics from '@/pages/AdminAnalytics';
import PackageManagement from '@/pages/PackageManagement';
import ActiveServices from '@/pages/ActiveServices';
import MerchantApplication from '@/pages/MerchantApplication';
import ReferralAgents from '@/pages/ReferralAgents';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/public-registration" element={<PublicRegistration />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Protected Routes */}
        {/* Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <ProfessionalDashboard />
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

        {/* Operations */}
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

        {/* Business Management */}
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

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
