
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { navItems } from "./nav-items";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import EnhancedLiveTracking from "./pages/EnhancedLiveTracking";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            
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
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
