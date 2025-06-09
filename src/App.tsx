
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { navItems } from "./nav-items";
import Login from "./pages/Login";
import Index from "./pages/Index";
import EnhancedLiveTracking from "./pages/EnhancedLiveTracking";
import LiveTracking from "./pages/LiveTracking";
import Settings from "./pages/Settings";
import ActiveServices from "./pages/ActiveServices";
import Maintenance from "./pages/Maintenance";
import WorkshopManagement from "./pages/WorkshopManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { useState } from "react";

const App = () => {
  // Create QueryClient inside component to avoid hook issues
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Main dashboard route */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              
              {/* Settings route */}
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              {/* Active Services route */}
              <Route path="/services" element={
                <ProtectedRoute>
                  <ActiveServices />
                </ProtectedRoute>
              } />
              
              {/* Maintenance route */}
              <Route path="/maintenance" element={
                <ProtectedRoute>
                  <Maintenance />
                </ProtectedRoute>
              } />
              
              {/* Workshop Management route */}
              <Route path="/workshop-management" element={
                <ProtectedRoute>
                  <WorkshopManagement />
                </ProtectedRoute>
              } />
              
              {/* Tracking routes */}
              <Route path="/tracking" element={
                <ProtectedRoute>
                  <LiveTracking />
                </ProtectedRoute>
              } />
              
              <Route path="/enhanced-tracking" element={
                <ProtectedRoute>
                  <EnhancedLiveTracking />
                </ProtectedRoute>
              } />
              
              {/* Dynamic routes from nav-items */}
              {navItems.map(({ to, page }) => (
                <Route key={to} path={to} element={
                  <ProtectedRoute>
                    {page}
                  </ProtectedRoute>
                } />
              ))}
              
              {/* Catch all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
