import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
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
const EnhancedLiveTracking = lazy(() => import('@/pages/EnhancedLiveTracking'));
const WorkshopSignup = lazy(() => import('@/pages/WorkshopSignup'));
const WorkshopLogin = lazy(() => import('@/pages/WorkshopLogin'));
const WorkshopDashboard = lazy(() => import('@/pages/WorkshopDashboard'));
const AdminAnalytics = lazy(() => import('@/pages/AdminAnalytics'));
const BecomeAMerchantPage = lazy(() => import('@/pages/BecomeAMerchantPage'));
const ReferralAgentSignupPage = lazy(() => import('@/pages/ReferralAgentSignupPage'));
const ReferralAgentManagementPage = lazy(() => import('@/pages/ReferralAgentManagement'));
const AgentDashboard = lazy(() => import('@/pages/AgentDashboard'));
const AgentProfilePage = lazy(() => import('@/pages/AgentProfilePage'));
const AgentReferralCodesPage = lazy(() => import('@/pages/AgentReferralCodesPage'));
const AgentReferredUsersPage = lazy(() => import('@/pages/AgentReferredUsersPage'));
const AgentCommissionsPage = lazy(() => import('@/pages/AgentCommissionsPage'));
const AgentPayoutsPage = lazy(() => import('@/pages/AgentPayoutsPage'));
const AgentAnalyticsPage = lazy(() => import('@/pages/AgentAnalyticsPage'));
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
                              
                              {/* Referral Agent Signup */}
                              <Route path="/referral-signup" element={<ReferralAgentSignupPage />} />

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
                              
                              {/* Consolidated Settings route - removed redundant admin-settings */}
                              <Route path="/settings" element={
                                <ProtectedRoute>
                                  <Settings />
                                </ProtectedRoute>
                              } />
                              
                              {/* Admin Analytics route */}
                              <Route path="/admin/analytics" element={
                                <ProtectedRoute requireAdmin={true}>
                                  <AdminAnalytics />
                                </ProtectedRoute>
                              } />

                              {/* Referral Agent Management route */}
                              <Route path="/referral-agents" element={
                                <ProtectedRoute requireAdmin={true}>
                                  <ReferralAgentManagementPage />
                                </ProtectedRoute>
                              } />

                              {/* Agent Dashboard route */}
                              <Route path="/agent/dashboard" element={
                                <ProtectedRoute requireAgent={true}>
                                  <AgentDashboard />
                                </ProtectedRoute>
                              } />
                              
                              {/* Agent Profile route */}
                              <Route path="/agent/profile" element={
                                <ProtectedRoute requireAgent={true}>
                                  <AgentProfilePage />
                                </ProtectedRoute>
                              } />

                              {/* Agent Referral Codes route */}
                              <Route path="/agent/referral-codes" element={
                                <ProtectedRoute requireAgent={true}>
                                  <AgentReferralCodesPage />
                                </ProtectedRoute>
                              } />

                              {/* Agent Referred Users route */}
                              <Route path="/agent/referred-users" element={
                                <ProtectedRoute requireAgent={true}>
                                  <AgentReferredUsersPage />
                                </ProtectedRoute>
                              } />
                              
                              {/* Agent Commissions route */}
                              <Route path="/agent/commissions" element={
                                <ProtectedRoute requireAgent={true}>
                                  <AgentCommissionsPage />
                                </ProtectedRoute>
                              } />

                              {/* Agent Payouts route */}
                              <Route path="/agent/payouts" element={
                                <ProtectedRoute requireAgent={true}>
                                  <AgentPayoutsPage />
                                </ProtectedRoute>
                              } />

                              {/* Agent Analytics route */}
                              <Route path="/agent/analytics" element={
                                <ProtectedRoute requireAgent={true}>
                                  <AgentAnalyticsPage />
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
                                  <EnhancedLiveTracking />
                                </ProtectedRoute>
                              } />
                              
                              <Route path="/merchant-application" element={
                                <ProtectedRoute>
                                  <BecomeAMerchantPage />
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
