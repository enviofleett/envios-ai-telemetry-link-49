
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EnhancedIndex from "./pages/EnhancedIndex";
import Auth from "./pages/Auth";
import UserManagement from "./pages/UserManagement";
import VehicleManagement from "./pages/VehicleManagement";
import StableEnhancedVehicleManagement from "./pages/StableEnhancedVehicleManagement";
import BulkExtraction from "./pages/BulkExtraction";
import DataImportReview from "./pages/DataImportReview";
import Settings from "./pages/Settings";
import SetPassword from "./pages/SetPassword";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import StableErrorBoundary from "./components/StableErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";

// Enhanced QueryClient configuration for stability
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const App = () => (
  <StableErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
              <Route path="/vehicles-legacy" element={
                <ProtectedRoute>
                  <Layout>
                    <StableErrorBoundary>
                      <VehicleManagement />
                    </StableErrorBoundary>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/bulk-extraction" element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <StableErrorBoundary>
                      <BulkExtraction />
                    </StableErrorBoundary>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/data-import-review" element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <StableErrorBoundary>
                      <DataImportReview />
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

export default App;
