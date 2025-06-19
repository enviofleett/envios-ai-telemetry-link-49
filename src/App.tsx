
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Dashboard from "@/pages/Dashboard";
import VehicleManagement from "@/pages/VehicleManagement";
import EnhancedVehicleManagementPage from "@/pages/EnhancedVehicleManagement";
import EnhancedIndex from "@/pages/EnhancedIndex";
import EnhancedLiveTracking from "@/pages/EnhancedLiveTracking";
import Reports from "@/pages/Reports";
import UserAnalytics from "@/pages/UserAnalytics";
import FleetAnalytics from "@/pages/FleetAnalytics";
import MobileDashboard from "@/components/mobile/MobileDashboard";

// Auth Pages
import LoginForm from "@/components/LoginForm";
import PasswordSetupCheck from "@/components/PasswordSetupCheck";
import OTPVerificationPage from "@/components/OTPVerificationPage";
import PasswordSetupPage from "@/components/PasswordSetupPage";

const queryClient = new QueryClient();

const App = () => {
  const isMobile = useIsMobile();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SidebarProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginForm />} />
                <Route path="/auth" element={<LoginForm />} />
                <Route path="/setup-password" element={<PasswordSetupPage />} />
                <Route path="/verify-otp" element={<OTPVerificationPage />} />
                <Route path="/password-setup-check" element={<PasswordSetupCheck />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      {isMobile ? <MobileDashboard /> : <EnhancedIndex />}
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      {isMobile ? <MobileDashboard /> : <Dashboard />}
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
                
                <Route path="/vehicle-management" element={
                  <ProtectedRoute>
                    <Layout>
                      <EnhancedVehicleManagementPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/tracking" element={
                  <ProtectedRoute>
                    <Layout>
                      <EnhancedLiveTracking />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Layout>
                      <Reports />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <Layout>
                      <UserAnalytics />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/fleet-analytics" element={
                  <ProtectedRoute>
                    <Layout>
                      <FleetAnalytics />
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </SidebarProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
