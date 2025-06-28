
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import GP51IntegrationPage from "./pages/GP51IntegrationPage";
import GPS51IntegrationPage from "./components/gps51/GPS51IntegrationPage";

// GPS51 Pages
import GPS51Dashboard from "./pages/GPS51Dashboard";
import GPS51LiveTracking from "./pages/GPS51LiveTracking";
import GPS51DeviceManagement from "./pages/GPS51DeviceManagement";
import GPS51TripHistory from "./pages/GPS51TripHistory";
import GPS51RouteAnalytics from "./pages/GPS51RouteAnalytics";
import GPS51Geofencing from "./pages/GPS51Geofencing";
import GPS51Reports from "./pages/GPS51Reports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/gp51" element={<GP51IntegrationPage />} />
            <Route path="/gps51" element={<GPS51IntegrationPage />} />
            
            {/* GPS51 Sub-routes */}
            <Route path="/gps51/dashboard" element={<GPS51Dashboard />} />
            <Route path="/gps51/tracking" element={<GPS51LiveTracking />} />
            <Route path="/gps51/devices" element={<GPS51DeviceManagement />} />
            <Route path="/gps51/history" element={<GPS51TripHistory />} />
            <Route path="/gps51/analytics" element={<GPS51RouteAnalytics />} />
            <Route path="/gps51/geofences" element={<GPS51Geofencing />} />
            <Route path="/gps51/reports" element={<GPS51Reports />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
