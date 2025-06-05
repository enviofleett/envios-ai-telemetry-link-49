
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import SafeQueryWrapper from '@/components/SafeQueryWrapper';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import FleetManagement from '@/pages/FleetManagement';
import VehicleManagement from '@/pages/VehicleManagement';
import EnhancedVehicleManagement from '@/pages/EnhancedVehicleManagement';
import StableEnhancedVehicleManagement from '@/pages/StableEnhancedVehicleManagement';
import LiveTracking from '@/pages/LiveTracking';
import FleetAnalytics from '@/pages/FleetAnalytics';
import BulkExtraction from '@/pages/BulkExtraction';
import DataImportReview from '@/pages/DataImportReview';
import UserManagement from '@/pages/UserManagement';
import Settings from '@/pages/Settings';
import SetPassword from '@/pages/SetPassword';
import EnhancedIndex from '@/pages/EnhancedIndex';
import NotFound from '@/pages/NotFound';

import { optimizedQueryClient } from '@/services/optimizedQueryClient';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={optimizedQueryClient}>
        <SafeQueryWrapper>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/set-password" element={<SetPassword />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/enhanced" element={<EnhancedIndex />} />
                  <Route path="/fleet" element={<FleetManagement />} />
                  <Route path="/vehicles" element={<VehicleManagement />} />
                  <Route path="/enhanced-vehicles" element={<EnhancedVehicleManagement />} />
                  <Route path="/stable-vehicles" element={<StableEnhancedVehicleManagement />} />
                  <Route path="/tracking" element={<LiveTracking />} />
                  <Route path="/analytics" element={<FleetAnalytics />} />
                  <Route path="/extraction" element={<BulkExtraction />} />
                  <Route path="/import-review" element={<DataImportReview />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </div>
              <Toaster />
            </Router>
          </AuthProvider>
        </SafeQueryWrapper>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
