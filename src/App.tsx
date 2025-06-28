
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UnifiedAuthProvider } from "@/contexts/UnifiedAuthContext";
import { AppRouter } from "@/components/routing/AppRouter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UnifiedAuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </UnifiedAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
