
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import UserManagement from "./pages/UserManagement";
import LiveTracking from "./pages/LiveTracking";
import Settings from "./pages/Settings";
import SystemImport from "./pages/SystemImport";
import PublicRegistration from "./pages/PublicRegistration";
import SetPassword from "./pages/SetPassword";
import DeviceConfiguration from "./pages/DeviceConfiguration";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/register" element={<Register />} />
              <Route path="/public-registration" element={<PublicRegistration />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/" element={<Layout><Index /></Layout>} />
              <Route path="/users" element={<Layout><UserManagement /></Layout>} />
              <Route path="/tracking" element={<Layout><LiveTracking /></Layout>} />
              <Route path="/device-configuration" element={<Layout><DeviceConfiguration /></Layout>} />
              <Route path="/settings" element={<Layout><Settings /></Layout>} />
              <Route path="/system-import" element={<Layout><SystemImport /></Layout>} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
