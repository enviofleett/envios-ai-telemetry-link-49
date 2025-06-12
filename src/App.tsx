
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import AuthenticatedRouter from '@/components/AuthenticatedRouter';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import GP51Setup from '@/pages/GP51Setup';
import AdminSettings from '@/pages/AdminSettings';
import UserManagement from '@/pages/UserManagement';
import VehicleManagement from '@/pages/VehicleManagement';
import Dashboard from '@/pages/Dashboard';

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
            <Route path="/settings/gp51-setup" element={
              <AuthenticatedRouter requiresGP51={false}>
                <GP51Setup />
              </AuthenticatedRouter>
            } />
            <Route
              path="/*"
              element={
                <AuthenticatedRouter requiresGP51={true}>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/vehicles" element={<VehicleManagement />} />
                      <Route path="/users" element={<UserManagement />} />
                      <Route path="/settings" element={<AdminSettings />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </AuthenticatedRouter>
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
