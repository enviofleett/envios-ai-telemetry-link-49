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
import Index from '@/pages/Index';
import EnhancedIndex from '@/pages/EnhancedIndex';
import FleetManagement from '@/pages/FleetManagement';
import FleetAnalytics from '@/pages/FleetAnalytics';
import EnhancedVehicleManagement from '@/pages/EnhancedVehicleManagement';
import StableEnhancedVehicleManagement from '@/pages/StableEnhancedVehicleManagement';
import VehicleManagement from '@/pages/VehicleManagement';
import UserManagement from '@/pages/UserManagement';
import BulkExtraction from '@/pages/BulkExtraction';
import DataImportReview from '@/pages/DataImportReview';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <QueryClientProvider client={optimizedQueryClient}>
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Index />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/enhanced" element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedIndex />
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
              <Route path="/fleet/analytics" element={
                <ProtectedRoute>
                  <Layout>
                    <FleetAnalytics />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/vehicles" element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedVehicleManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/vehicles/stable" element={
                <ProtectedRoute>
                  <Layout>
                    <StableEnhancedVehicleManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/vehicles/manage" element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleManagement />
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
              <Route path="/extraction" element={
                <ProtectedRoute>
                  <Layout>
                    <BulkExtraction />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/import/review" element={
                <ProtectedRoute>
                  <Layout>
                    <DataImportReview />
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
