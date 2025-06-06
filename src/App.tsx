
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { optimizedQueryClient } from '@/services/optimizedQueryClient';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Auth from '@/pages/Auth';
import SetPassword from '@/pages/SetPassword';
import Dashboard from '@/pages/Dashboard';
import FleetManagement from '@/pages/FleetManagement';
import VehicleManagement from '@/pages/VehicleManagement';
import LiveTracking from '@/pages/LiveTracking';
import UserManagement from '@/pages/UserManagement';
import Settings from '@/pages/Settings';
import SystemImport from '@/pages/SystemImport';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <QueryClientProvider client={optimizedQueryClient}>
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/fleet" element={
                <ProtectedRoute>
                  <Layout>
                    <FleetManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/vehicles" element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/tracking" element={
                <ProtectedRoute>
                  <Layout>
                    <LiveTracking />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/system-import" element={
                <ProtectedRoute requireAdmin={true}>
                  <Layout>
                    <SystemImport />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Toaster />
        </AuthProvider>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
