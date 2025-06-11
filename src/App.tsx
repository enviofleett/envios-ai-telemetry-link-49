
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import AdminSettings from '@/pages/AdminSettings';
import UserManagement from '@/pages/UserManagement';
import VehicleManagement from '@/pages/VehicleManagement';
import LocationHistory from '@/pages/LocationHistory';
import Dashboard from '@/pages/Dashboard';
import DeviceSubscriptions from '@/pages/DeviceSubscriptions';
import SystemImport from '@/pages/SystemImport';
import BillingManagement from '@/pages/BillingManagement';
import MaintenanceBooking from '@/pages/MaintenanceBooking';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/vehicles" element={<VehicleManagement />} />
                      <Route path="/users" element={<UserManagement />} />
                      <Route path="/location-history" element={<LocationHistory />} />
                      <Route path="/subscriptions" element={<DeviceSubscriptions />} />
                      <Route path="/billing" element={<BillingManagement />} />
                      <Route path="/maintenance" element={<MaintenanceBooking />} />
                      <Route path="/import" element={<SystemImport />} />
                      <Route path="/settings" element={<AdminSettings />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
