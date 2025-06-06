
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
import Tracking from "./pages/Tracking";
import Settings from "./pages/Settings";
import SystemImport from "./pages/SystemImport";
import PublicRegistration from "./pages/PublicRegistration";
import SetPassword from "./pages/SetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/public-registration" element={<PublicRegistration />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/users" element={<Layout><UserManagement /></Layout>} />
            <Route path="/tracking" element={<Layout><Tracking /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="/system-import" element={<Layout><SystemImport /></Layout>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
