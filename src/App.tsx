
import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { SecurityProvider } from '@/components/security/SecurityProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Settings from '@/pages/Settings';
import Index from '@/pages/Index';
import Vehicles from '@/pages/Vehicles';
import UserManagement from '@/pages/UserManagement';
import Reports from '@/pages/Reports';
import Marketplace from '@/pages/Marketplace';
import PackageManagement from '@/pages/PackageManagement';
import SystemImport from '@/pages/SystemImport';
import DeviceConfiguration from '@/pages/DeviceConfiguration';
import NotFound from '@/pages/NotFound';
import ComingSoon from '@/pages/ComingSoon';
import Loading from '@/components/Loading';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrandingProvider>
            <CurrencyProvider>
              <SecurityProvider>
                <SidebarProvider>
                  <Router>
                    <div className="App min-h-screen flex w-full bg-background">
                      <Suspense fallback={<Loading />}>
                        <Routes>
                          {/* Public Routes - No sidebar */}
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/merchant-application" element={<ComingSoon pageName="Merchant Application" />} />
                          
                          {/* Authenticated Routes - With unified layout */}
                          <Route path="/*" element={<AuthenticatedApp />} />
                        </Routes>
                      </Suspense>
                      <Toaster />
                    </div>
                  </Router>
                </SidebarProvider>
              </SecurityProvider>
            </CurrencyProvider>
          </BrandingProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// Authenticated app with sidebar
function AuthenticatedApp() {
  return (
    <>
      <AppSidebar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/packages" element={<PackageManagement />} />
          <Route path="/system-import" element={<SystemImport />} />
          <Route path="/device-configuration" element={<DeviceConfiguration />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
