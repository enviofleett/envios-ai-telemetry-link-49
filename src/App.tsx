import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import BulkExtraction from '@/pages/BulkExtraction';
import VehicleManagement from '@/pages/VehicleManagement';
import UserManagement from '@/pages/UserManagement';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import SetPassword from './pages/SetPassword';
import PasswordSetupCheck from './components/PasswordSetupCheck';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/" element={
                <PasswordSetupCheck>
                  <ProtectedRoute>
                    <Layout>
                      <Index />
                    </Layout>
                  </ProtectedRoute>
                </PasswordSetupCheck>
              } />
              <Route path="/bulk-extraction" element={
                <PasswordSetupCheck>
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <BulkExtraction />
                    </Layout>
                  </ProtectedRoute>
                </PasswordSetupCheck>
              } />
              <Route path="/vehicle-management" element={
                <PasswordSetupCheck>
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <VehicleManagement />
                    </Layout>
                  </ProtectedRoute>
                </PasswordSetupCheck>
              } />
              <Route path="/user-management" element={
                <PasswordSetupCheck>
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <UserManagement />
                    </Layout>
                  </ProtectedRoute>
                </PasswordSetupCheck>
              } />
              <Route path="/settings" element={
                <PasswordSetupCheck>
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                </PasswordSetupCheck>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
