
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GP51AuthProvider } from "@/contexts/GP51AuthContext";
import { GP51SessionProvider } from "@/contexts/GP51SessionContext";
import { navItems } from "./nav-items";
import Index from "./pages/Index";
import GP51Auth from "./pages/GP51Auth";
import NotFound from "./pages/NotFound";
import EnhancedLiveTracking from "./pages/EnhancedLiveTracking";
import ProtectedRoute from "./components/ProtectedRoute";
import StableErrorBoundary from "./components/StableErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  return (
    <StableErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GP51AuthProvider>
          <GP51SessionProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <StableErrorBoundary>
                  <Routes>
                    {/* GP51 Authentication routes */}
                    <Route 
                      path="/auth" 
                      element={
                        <StableErrorBoundary>
                          <GP51Auth />
                        </StableErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/login" 
                      element={
                        <StableErrorBoundary>
                          <GP51Auth />
                        </StableErrorBoundary>
                      } 
                    />
                    
                    {/* Protected routes */}
                    <Route path="/enhanced-tracking" element={
                      <StableErrorBoundary>
                        <ProtectedRoute>
                          <EnhancedLiveTracking />
                        </ProtectedRoute>
                      </StableErrorBoundary>
                    } />
                    
                    {/* Main navigation items */}
                    {navItems.map(({ to, page }) => {
                      return (
                        <Route 
                          key={to} 
                          path={to} 
                          element={
                            <StableErrorBoundary>
                              {page ? (
                                <ProtectedRoute>
                                  {page}
                                </ProtectedRoute>
                              ) : <NotFound />}
                            </StableErrorBoundary>
                          } 
                        />
                      );
                    })}
                    
                    {/* Default protected route */}
                    <Route path="/" element={
                      <StableErrorBoundary>
                        <ProtectedRoute>
                          <Index />
                        </ProtectedRoute>
                      </StableErrorBoundary>
                    } />
                    
                    {/* Catch-all for 404 */}
                    <Route path="*" element={
                      <StableErrorBoundary>
                        <NotFound />
                      </StableErrorBoundary>
                    } />
                  </Routes>
                </StableErrorBoundary>
              </BrowserRouter>
            </TooltipProvider>
          </GP51SessionProvider>
        </GP51AuthProvider>
      </QueryClientProvider>
    </StableErrorBoundary>
  );
};

export default App;
