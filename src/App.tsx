
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import StableErrorBoundary from "@/components/StableErrorBoundary";

// Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ProfessionalDashboard from "@/components/dashboard/ProfessionalDashboard";
import EnhancedLiveTracking from "@/pages/EnhancedLiveTracking";
import EnhancedVehicleManagement from "@/pages/EnhancedVehicleManagement";
import EnhancedUserManagement from "@/pages/EnhancedUserManagement";
import StableAdminSettings from "@/pages/StableAdminSettings";
import SystemImport from "@/pages/SystemImport";
import DeviceConfiguration from "@/pages/DeviceConfiguration";
import Maintenance from "@/pages/Maintenance";
import WorkshopManagement from "@/pages/WorkshopManagement";
import Marketplace from "@/pages/Marketplace";
import Reports from "@/pages/Reports";
import PackageManagement from "@/pages/PackageManagement";
import ActiveServices from "@/pages/ActiveServices";
import PublicRegistration from "@/pages/PublicRegistration";
import VerifyOTP from "@/pages/VerifyOTP";
import SetPassword from "@/pages/SetPassword";
import MerchantApplication from "@/pages/MerchantApplication";
import AdminAnalytics from "@/pages/AdminAnalytics";
import ReferralAgents from "@/pages/ReferralAgents";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <StableErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <BrandingProvider>
              <CurrencyProvider>
                <TooltipProvider>
                  <Router>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/public-registration" element={<PublicRegistration />} />
                      <Route path="/verify-otp" element={<VerifyOTP />} />
                      <Route path="/set-password" element={<SetPassword />} />

                      {/* Protected routes with Layout wrapper */}
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
                        path="/admin/analytics"
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <AdminAnalytics />
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
                  <Toaster />
                  <ReactQueryDevtools initialIsOpen={false} />
                </TooltipProvider>
              </CurrencyProvider>
            </BrandingProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StableErrorBoundary>
  );
}

export default App;
