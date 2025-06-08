
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GP51SessionProvider } from "@/contexts/GP51SessionContext";
import { navItems } from "./nav-items";
import Index from "./pages/Index";
import SimpleAuth from "./pages/SimpleAuth";
import Register from "./pages/Register";
import MinimalAuth from "./components/MinimalAuth";
import NotFound from "./pages/NotFound";
import EnhancedLiveTracking from "./pages/EnhancedLiveTracking";
import ProtectedRoute from "./components/ProtectedRoute";
import StableErrorBoundary from "./components/StableErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  console.log('App component rendering');

  return (
    <StableErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GP51SessionProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <StableErrorBoundary>
                  <Routes>
                    {/* Public auth routes with error boundaries */}
                    <Route 
                      path="/auth" 
                      element={
                        <StableErrorBoundary fallbackComponent={<MinimalAuth />}>
                          <SimpleAuth />
                        </StableErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/register" 
                      element={
                        <StableErrorBoundary fallbackComponent={<MinimalAuth />}>
                          <Register />
                        </StableErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/minimal-auth" 
                      element={
                        <StableErrorBoundary>
                          <MinimalAuth />
                        </StableErrorBoundary>
                      } 
                    />
                    <Route path="/login" element={
                      <StableErrorBoundary fallbackComponent={<MinimalAuth />}>
                        <SimpleAuth />
                      </StableErrorBoundary>
                    } />
                    
                    {/* Protected routes */}
                    <Route path="/enhanced-tracking" element={
                      <StableErrorBoundary>
                        <ProtectedRoute>
                          <EnhancedLiveTracking />
                        </ProtectedRoute>
                      </StableErrorBoundary>
                    } />
                    
                    {/* Main navigation items */}
                    {navItems.map(({ to, page }) => (
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
                    ))}
                    
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
        </AuthProvider>
      </QueryClientProvider>
    </StableErrorBoundary>
  );
};

export default App;
