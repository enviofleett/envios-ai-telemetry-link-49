import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UnifiedAuthProvider } from "@/contexts/UnifiedAuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppRouter } from "@/components/routing/AppRouter";
import { StableErrorBoundary } from "@/components/StableErrorBoundary";
import { SystemMonitoringDashboard } from '@/components/monitoring/SystemMonitoringDashboard';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

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
          <UnifiedAuthProvider>
            <BrandingProvider>
              <CurrencyProvider>
                <TooltipProvider>
                  <Router>
                    <div className="min-h-screen bg-background">
                      <Routes>
                        <Route 
                          path="/" 
                          element={<AppRouter />} 
                        />
                        <Route 
                          path="/monitoring" 
                          element={
                            <ProtectedRoute requiredRole="admin">
                              <Layout>
                                <SystemMonitoringDashboard />
                              </Layout>
                            </ProtectedRoute>
                          } 
                        />
                      </Routes>
                    </div>
                  </Router>
                  <Toaster />
                  <Sonner />
                  <ReactQueryDevtools initialIsOpen={false} />
                </TooltipProvider>
              </CurrencyProvider>
            </BrandingProvider>
          </UnifiedAuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StableErrorBoundary>
  );
}

export default App;
