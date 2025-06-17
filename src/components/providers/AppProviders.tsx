
import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as RadixToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import StableErrorBoundary from "@/components/StableErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <StableErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <BrandingProvider>
              <CurrencyProvider>
                <TooltipProvider>
                  {children}
                  <Toaster />
                  <RadixToaster />
                  <ReactQueryDevtools initialIsOpen={false} />
                </TooltipProvider>
              </CurrencyProvider>
            </BrandingProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StableErrorBoundary>
  );
};

export default AppProviders;
