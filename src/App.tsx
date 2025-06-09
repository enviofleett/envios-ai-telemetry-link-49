
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
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/enhanced-tracking" element={
              <ProtectedRoute>
                <EnhancedLiveTracking />
              </ProtectedRoute>
            } />
            {navItems.map(({ to, page }) => (
              <Route key={to} path={to} element={
                <ProtectedRoute>
                  {page}
                </ProtectedRoute>
              } />
            ))}
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
