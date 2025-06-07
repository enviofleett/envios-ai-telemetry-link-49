
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GP51SessionProvider } from "@/contexts/GP51SessionContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserManagement from "./pages/UserManagement";
import LiveTracking from "./pages/LiveTracking";
import DeviceConfiguration from "./pages/DeviceConfiguration";
import SystemImport from "./pages/SystemImport";
import Settings from "./pages/Settings";
import PackageManagement from "./pages/PackageManagement";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GP51SessionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/tracking" element={<LiveTracking />} />
                <Route path="/device-configuration" element={<DeviceConfiguration />} />
                <Route path="/system-import" element={<SystemImport />} />
                <Route path="/packages" element={<PackageManagement />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </GP51SessionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
