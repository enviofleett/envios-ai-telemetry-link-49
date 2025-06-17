import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { SecurityProvider } from '@/components/security/SecurityProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Settings from '@/pages/Settings';
import Loading from '@/components/Loading';

// Import all page components for routing
import VehicleManagement from '@/pages/VehicleManagement';
import UserManagement from '@/pages/UserManagement';
import Reports from '@/pages/Reports';
import Marketplace from '@/pages/Marketplace';
import PackageManagement from '@/pages/PackageManagement';
import SystemImport from '@/pages/SystemImport';
import DeviceConfiguration from '@/pages/DeviceConfiguration';
import FleetManagement from '@/pages/FleetManagement';
import LiveTracking from '@/pages/LiveTracking';
import Maintenance from '@/pages/Maintenance';
import WorkshopManagement from '@/pages/WorkshopManagement';
import ActiveServices from '@/pages/ActiveServices';
import MerchantApplication from '@/pages/MerchantApplication';
import ReferralAgents from '@/pages/ReferralAgents';
import AdminAnalytics from '@/pages/AdminAnalytics';

// Agent portal pages
import AgentDashboard from '@/pages/agent/AgentDashboard';
import AgentAnalytics from '@/pages/agent/AgentAnalytics';
import AgentReferralCodes from '@/pages/agent/AgentReferralCodes';
import AgentReferredUsers from '@/pages/agent/AgentReferredUsers';
import AgentCommissions from '@/pages/agent/AgentCommissions';
import AgentPayouts from '@/pages/agent/AgentPayouts';
import AgentProfile from '@/pages/agent/AgentProfile';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrandingProvider>
            <CurrencyProvider>
              <SecurityProvider>
                <Router>
                  <div className="App">
                    <Suspense fallback={<Loading />}>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        
                        {/* Protected routes with layout */}
                        <Route path="/" element={
                          <ProtectedRoute>
                            <Layout>
                              <Dashboard />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Fleet Management Routes */}
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
                        
                        {/* Service Management Routes */}
                        <Route path="/services" element={
                          <ProtectedRoute>
                            <Layout>
                              <ActiveServices />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/maintenance" element={
                          <ProtectedRoute>
                            <Layout>
                              <Maintenance />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/workshop-management" element={
                          <ProtectedRoute>
                            <Layout>
                              <WorkshopManagement />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Analytics & Reports */}
                        <Route path="/reports" element={
                          <ProtectedRoute>
                            <Layout>
                              <Reports />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Marketplace */}
                        <Route path="/marketplace" element={
                          <ProtectedRoute>
                            <Layout>
                              <Marketplace />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/merchant-application" element={
                          <ProtectedRoute>
                            <Layout>
                              <MerchantApplication />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        {/* User Management */}
                        <Route path="/users" element={
                          <ProtectedRoute>
                            <Layout>
                              <UserManagement />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/referral-agents" element={
                          <ProtectedRoute>
                            <Layout>
                              <ReferralAgents />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Admin Routes */}
                        <Route path="/admin/analytics" element={
                          <ProtectedRoute requireAdmin>
                            <Layout>
                              <AdminAnalytics />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/packages" element={
                          <ProtectedRoute>
                            <Layout>
                              <PackageManagement />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/system-import" element={
                          <ProtectedRoute>
                            <Layout>
                              <SystemImport />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/device-configuration" element={
                          <ProtectedRoute>
                            <Layout>
                              <DeviceConfiguration />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Agent Portal Routes */}
                        <Route path="/agent/dashboard" element={
                          <ProtectedRoute requireAgent>
                            <Layout>
                              <AgentDashboard />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/agent/analytics" element={
                          <ProtectedRoute requireAgent>
                            <Layout>
                              <AgentAnalytics />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/agent/referral-codes" element={
                          <ProtectedRoute requireAgent>
                            <Layout>
                              <AgentReferralCodes />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/agent/referred-users" element={
                          <ProtectedRoute requireAgent>
                            <Layout>
                              <AgentReferredUsers />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/agent/commissions" element={
                          <ProtectedRoute requireAgent>
                            <Layout>
                              <AgentCommissions />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/agent/payouts" element={
                          <ProtectedRoute requireAgent>
                            <Layout>
                              <AgentPayouts />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/agent/profile" element={
                          <ProtectedRoute requireAgent>
                            <Layout>
                              <AgentProfile />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Settings - Keep existing route structure */}
                        <Route path="/settings" element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        } />
                      </Routes>
                    </Suspense>
                    <Toaster />
                  </div>
                </Router>
              </SecurityProvider>
            </CurrencyProvider>
          </BrandingProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
