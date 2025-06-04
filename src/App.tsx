
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SetPassword from "./pages/SetPassword";
import EnhancedIndex from "./pages/EnhancedIndex";
import EnhancedUserManagement from "./pages/EnhancedUserManagement";
import EnhancedVehicleManagement from "./pages/EnhancedVehicleManagement";
import Settings from "./pages/Settings";
import BulkExtraction from "./pages/BulkExtraction";
import DataImportReview from "./pages/DataImportReview";
import SystemMonitoring from "./pages/SystemMonitoring";
import NotFound from "./pages/NotFound";

const App = () => {
  // Create QueryClient with stable configuration
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ErrorBoundary>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/set-password" element={<SetPassword />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Index />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <EnhancedIndex />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/users" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <EnhancedUserManagement />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/vehicles" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <EnhancedVehicleManagement />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Settings />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/extraction" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <BulkExtraction />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/import-review" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <DataImportReview />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/monitoring" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <SystemMonitoring />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
