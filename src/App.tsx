
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter } from "react-router-dom";
import { UnifiedAuthProvider } from "@/contexts/UnifiedAuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppRouter } from "@/components/routing/AppRouter";
import { StableErrorBoundary } from "@/components/StableErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <StableErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <UnifiedAuthProvider>
            <BrandingProvider>
              <CurrencyProvider>
                <TooltipProvider>
                  <BrowserRouter>
                    <AppRouter />
                  </BrowserRouter>
                  <Toaster />
                  <Sonner />
                  <ReactQueryDevtools initialIsOpen={false} />
                </TooltipProvider>
              </CurrencyProvider>
            </BrandingProvider>
          </UnifiedAuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StableErrorBoundary>
  );
};

export default App;
