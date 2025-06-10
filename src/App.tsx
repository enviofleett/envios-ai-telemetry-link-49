
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import WorkshopManagement from "./pages/WorkshopManagement";
import WorkshopAnalytics from "./pages/WorkshopAnalytics";
import VehicleManagement from "./pages/VehicleManagement";
import Marketplace from "./pages/Marketplace";
import PackageManagement from "./pages/PackageManagement";
import SystemImport from "./pages/SystemImport";
import DeviceConfiguration from "./pages/DeviceConfiguration";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicles" element={<VehicleManagement />} />
          <Route path="/vehicle-management" element={<VehicleManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/packages" element={<PackageManagement />} />
          <Route path="/system-import" element={<SystemImport />} />
          <Route path="/device-configuration" element={<DeviceConfiguration />} />
          <Route path="/workshop-management" element={<WorkshopManagement />} />
          <Route path="/workshop-analytics" element={<WorkshopAnalytics />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
