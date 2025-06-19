
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy load components for better performance
const Login = React.lazy(() => import('@/pages/Login'));
const Register = React.lazy(() => import('@/pages/Register'));
const ProfessionalDashboard = React.lazy(() => import('@/components/dashboard/ProfessionalDashboard'));
const EnhancedLiveTracking = React.lazy(() => import('@/pages/EnhancedLiveTracking'));
const EnhancedVehicleManagement = React.lazy(() => import('@/pages/EnhancedVehicleManagement'));
const UserVehicles = React.lazy(() => import('@/pages/UserVehicles'));
const EnhancedUserManagement = React.lazy(() => import('@/pages/EnhancedUserManagement'));
const StableAdminSettings = React.lazy(() => import('@/pages/StableAdminSettings'));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useUnifiedAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useUnifiedAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const ConsolidatedAppRouter: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      }>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
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

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900">404</h1>
                  <p className="text-gray-600 mt-2">Page not found</p>
                  <button 
                    onClick={() => window.history.back()}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default ConsolidatedAppRouter;
