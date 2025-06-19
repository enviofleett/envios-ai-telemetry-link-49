
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UnifiedAuthProvider } from "@/contexts/UnifiedAuthContext";
import ConsolidatedAppRouter from "@/components/routing/ConsolidatedAppRouter";

// Configure React Query with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UnifiedAuthProvider>
          <SidebarProvider>
            <ConsolidatedAppRouter />
            <Toaster />
            <Sonner />
          </SidebarProvider>
        </UnifiedAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
