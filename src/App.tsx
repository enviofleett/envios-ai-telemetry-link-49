
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
import NotFound from "./pages/NotFound";
import EnhancedLiveTracking from "./pages/EnhancedLiveTracking";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <GP51SessionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public auth route */}
              <Route path="/auth" element={<SimpleAuth />} />
              <Route path="/login" element={<SimpleAuth />} />
              <Route path="/register" element={<SimpleAuth />} />
              
              {/* Protected routes */}
              <Route path="/enhanced-tracking" element={
                <ProtectedRoute>
                  <EnhancedLiveTracking />
                </ProtectedRoute>
              } />
              
              {/* Main navigation items */}
              {navItems.map(({ to, page }) => (
                <Route 
                  key={to} 
                  path={to} 
                  element={page ? (
                    <ProtectedRoute>
                      {page}
                    </ProtectedRoute>
                  ) : <NotFound />} 
                />
              ))}
              
              {/* Default protected route */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              
              {/* Catch-all for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </GP51SessionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
