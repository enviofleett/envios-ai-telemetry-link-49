
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { optimizedQueryClient } from "./services/optimizedQueryClient";
import EnhancedIndex from "./pages/EnhancedIndex";
import Auth from "./pages/Auth";
import UserManagement from "./pages/UserManagement";
import StableEnhancedVehicleManagement from "./pages/StableEnhancedVehicleManagement";
import Settings from "./pages/Settings";
import SetPassword from "./pages/SetPassword";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import StableErrorBoundary from "./components/StableErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <StableErrorBoundary>
      <QueryClientProvider client={optimizedQueryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ReactQueryDevtools initialIsOpen={false} />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/set-password" element={<SetPassword />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <StableErrorBoundary>
                        <EnhancedIndex />
                      </StableErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <StableErrorBoundary>
                        <UserManagement />
                      </StableErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/vehicles" element={
                  <ProtectedRoute>
                    <Layout>
                      <StableErrorBoundary>
                        <StableEnhancedVehicleManagement />
                      </StableErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Layout>
                      <StableErrorBoundary>
                        <Settings />
                      </StableErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </StableErrorBoundary>
  );
}

export default App;
