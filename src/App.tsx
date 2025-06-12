
import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import NetworkErrorBoundary from '@/components/error/NetworkErrorBoundary';
import StableErrorBoundary from '@/components/StableErrorBoundary';
import { SecurityProvider } from '@/components/security/SecurityProvider';
import Loading from '@/components/Loading';
import ProtectedRoute from '@/components/ProtectedRoute';
import { navItems } from '@/nav-items';

// Lazy load components
const Login = lazy(() => import('@/pages/Login'));
const Auth = lazy(() => import('@/pages/Auth'));
const Index = lazy(() => import('@/pages/Index'));
const Settings = lazy(() => import('@/pages/Settings'));
const ActiveServices = lazy(() => import('@/pages/ActiveServices'));
const Maintenance = lazy(() => import('@/pages/Maintenance'));
const WorkshopManagement = lazy(() => import('@/pages/WorkshopManagement'));
const LiveTracking = lazy(() => import('@/pages/LiveTracking'));
const EnhancedLiveTracking = lazy(() => import('@/pages/EnhancedLiveTracking'));
const WorkshopSignup = lazy(() => import('@/pages/WorkshopSignup'));
const WorkshopLogin = lazy(() => import('@/pages/WorkshopLogin'));
const WorkshopDashboard = lazy(() => import('@/pages/WorkshopDashboard'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <StableErrorBoundary>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <BrandingProvider>
                <CurrencyProvider>
                  <SecurityProvider>
                    <NetworkErrorBoundary>
                      <Router>
                        <div className="min-h-screen bg-background font-sans antialiased">
                          <Suspense fallback={<Loading />}>
                            <Routes>
                              <Route path="/login" element={<Login />} />
                              <Route path="/auth" element={<Auth />} />
                              
                              {/* Workshop Routes (Public) */}
                              <Route path="/workshop-signup" element={<WorkshopSignup />} />
                              <Route path="/workshop-login" element={<WorkshopLogin />} />
                              <Route path="/workshop-dashboard" element={<WorkshopDashboard />} />
                              
                              {/* Main dashboard route */}
                              <Route path="/" element={
                                <ProtectedRoute>
                                  <Index />
                                </ProtectedRoute>
                              } />
                              
                              {/* Settings route */}
                              <Route path="/settings" element={
                                <ProtectedRoute>
                                  <Settings />
                                </ProtectedRoute>
                              } />
                              
                              {/* Active Services route */}
                              <Route path="/services" element={
                                <ProtectedRoute>
                                  <ActiveServices />
                                </ProtectedRoute>
                              } />
                              
                              {/* Maintenance route */}
                              <Route path="/maintenance" element={
                                <ProtectedRoute>
                                  <Maintenance />
                                </ProtectedRoute>
                              } />
                              
                              {/* Workshop Management route */}
                              <Route path="/workshop-management" element={
                                <ProtectedRoute>
                                  <WorkshopManagement />
                                </ProtectedRoute>
                              } />
                              
                              {/* Tracking routes */}
                              <Route path="/tracking" element={
                                <ProtectedRoute>
                                  <LiveTracking />
                                </ProtectedRoute>
                              } />
                              
                              <Route path="/enhanced-tracking" element={
                                <ProtectedRoute>
                                  <EnhancedLiveTracking />
                                </ProtectedRoute>
                              } />
                              
                              {/* Dynamic routes from nav-items */}
                              {navItems.map(({ to, page }) => (
                                <Route key={to} path={to} element={
                                  <ProtectedRoute>
                                    {page}
                                  </ProtectedRoute>
                                } />
                              ))}
                              
                              {/* Catch all route for 404 */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                          <Toaster />
                        </div>
                      </Router>
                    </NetworkErrorBoundary>
                  </SecurityProvider>
                </CurrencyProvider>
              </BrandingProvider>
            </AuthProvider>
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ErrorBoundary>
    </StableErrorBoundary>
  );
}

export default App;
